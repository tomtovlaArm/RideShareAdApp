import { type User, type InsertUser, type Ad, type InsertAd, users, ads } from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllAds(): Promise<Ad[]>;
  getAd(id: number): Promise<Ad | undefined>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: number, ad: Partial<InsertAd>): Promise<Ad | undefined>;
  deleteAd(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllAds(): Promise<Ad[]> {
    return db.select().from(ads).orderBy(asc(ads.sortOrder), asc(ads.id));
  }

  async getAd(id: number): Promise<Ad | undefined> {
    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad;
  }

  async createAd(ad: InsertAd): Promise<Ad> {
    const [created] = await db.insert(ads).values(ad).returning();
    return created;
  }

  async updateAd(id: number, ad: Partial<InsertAd>): Promise<Ad | undefined> {
    const [updated] = await db.update(ads).set(ad).where(eq(ads.id, id)).returning();
    return updated;
  }

  async deleteAd(id: number): Promise<void> {
    await db.delete(ads).where(eq(ads.id, id));
  }
}

export const storage = new DatabaseStorage();

export async function seedDefaultAds() {
  console.log("Checking if ads need seeding...");
  const existing = await storage.getAllAds();
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing ads, skipping seed`);
    return;
  }

  const defaultAds: InsertAd[] = [
    {
      name: "Safe VapeBox",
      brand: "Sponsored",
      price: "12.99",
      type: "video",
      mediaUrl: "/assets/ad-video-1.mp4",
      description: "Vape box for 510 and Disposable Pod vapes with sanitary tips.",
      qrUrl: "safevaprbox.com",
      sortOrder: 1,
    },
    {
      name: "Chronos Elite",
      brand: "LuxeTime",
      price: "$4,500",
      type: "image",
      mediaUrl: "/assets/ads-watch.png",
      description: "Precision engineering meets timeless elegance. The Chronos Elite is crafted for those who value every second.",
      qrUrl: "",
      sortOrder: 1,
    },
    {
      name: "Sonic Pro X",
      brand: "AudioTech",
      price: "$399",
      type: "image",
      mediaUrl: "/assets/ads-headphones.png",
      description: "Immerse yourself in pure sound. Active noise cancellation and 40-hour battery life for the longest journeys.",
      qrUrl: "",
      sortOrder: 2,
    },
    {
      name: "Midnight Rose",
      brand: "Maison Scent",
      price: "$180",
      type: "image",
      mediaUrl: "/assets/ads-perfume.png",
      description: "A captivating blend of dark rose, amber, and vanilla. Leave a lasting impression wherever you go.",
      qrUrl: "",
      sortOrder: 3,
    },
  ];

  for (const ad of defaultAds) {
    await storage.createAd(ad);
  }
  console.log("Seeded default ads into database");
}

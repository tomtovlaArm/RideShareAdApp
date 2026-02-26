import { type User, type InsertUser, type Ad, type InsertAd, type MediaFile, users, ads, mediaFiles } from "@shared/schema";
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
  saveMediaFile(filename: string, mimeType: string, data: string): Promise<MediaFile>;
  getMediaFile(id: number): Promise<MediaFile | undefined>;
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

  async saveMediaFile(filename: string, mimeType: string, data: string): Promise<MediaFile> {
    const [file] = await db.insert(mediaFiles).values({ filename, mimeType, data }).returning();
    return file;
  }

  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file;
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
      name: "Vape holder for 510 cartridge with battery and hygiene tips",
      brand: "Safe VapeBox",
      price: "",
      type: "video",
      mediaUrl: "https://www.dropbox.com/scl/fi/l8cnik0hrkt0h7wpikyaw/vape-2-text-not-audio-horizontal0001-0638.mp4?rlkey=nymrgb2l8h0xxhhhe3yfre5ex&st=3pa8loze&dl=1",
      description: "Vape packaging for 510 and Disposable Pod vapes with sanitary tips.",
      qrUrl: "safevapebox.com",
      sortOrder: 1,
      displayDuration: 30,
    },
    {
      name: "Vape Holder Box",
      brand: "Safe VapeBox",
      price: "",
      type: "image",
      mediaUrl: "https://www.dropbox.com/scl/fi/0n627qnpamzpug6mlivic/2-2.jpg?rlkey=m4in7n9nbgr6b3avm1mrkqgwp&st=gkvi7pw7&dl=1",
      description: "Vape Box with Hygienic Sanitary Tips for Clean, Safe Vaping.\nPerfect for clean, hygienic use and safer sharing!",
      qrUrl: "safevapebox.com",
      sortOrder: 3,
      displayDuration: 20,
    },
    {
      name: "Vape Holder for disposable pods",
      brand: "Safe VapeBox",
      price: "",
      type: "video",
      mediaUrl: "https://www.dropbox.com/scl/fi/cidqoeb2m81uhi7q0a1te/VAPE-2-TEXT-horizontal-no-audio0001-0630.mp4?rlkey=uaxcwzs9yf1x6l9570l9lun5z&st=yii26yic&dl=1",
      description: "VapeBox For Pod Style Vape",
      qrUrl: "safevapebox.com",
      sortOrder: 4,
      displayDuration: 20,
    },
  ];

  for (const ad of defaultAds) {
    await storage.createAd(ad);
  }
  console.log("Seeded default ads into database");
}

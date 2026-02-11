import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Upload, X, ArrowLeft, GripVertical, Image, Video, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ad } from "@shared/schema";

function AdForm({ ad, onClose, onSaved }: { ad?: Ad; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(ad?.name || "");
  const [brand, setBrand] = useState(ad?.brand || "");
  const [price, setPrice] = useState(ad?.price || "");
  const [type, setType] = useState<string>(ad?.type || "image");
  const [description, setDescription] = useState(ad?.description || "");
  const [qrUrl, setQrUrl] = useState(ad?.qrUrl || "");
  const [sortOrder, setSortOrder] = useState(ad?.sortOrder?.toString() || "0");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>(ad?.mediaUrl || "");
  const [mediaUrlInput, setMediaUrlInput] = useState(ad?.mediaUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    if (file.type.startsWith("video/")) setType("video");
    else setType("image");
  };

  const handleSubmit = async () => {
    if (!mediaFile && !mediaUrlInput && !ad?.mediaUrl) {
      setError("Please upload a file or paste a media URL");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("brand", brand);
      formData.append("price", price);
      formData.append("type", type);
      formData.append("description", description);
      formData.append("qrUrl", qrUrl);
      formData.append("sortOrder", sortOrder);
      if (mediaFile) {
        formData.append("media", mediaFile);
      } else if (mediaUrlInput) {
        formData.append("mediaUrl", mediaUrlInput);
      } else if (ad?.mediaUrl) {
        formData.append("mediaUrl", ad.mediaUrl);
      }

      const url = ad ? `/api/ads/${ad.id}` : "/api/ads";
      const method = ad ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to save (${res.status})`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save ad");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{ad ? "Edit Ad" : "New Ad"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full h-40 rounded-xl border-2 border-dashed border-neutral-700 hover:border-neutral-500 flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
            data-testid="dropzone-media"
          >
            {mediaPreview ? (
              type === "video" ? (
                <video src={mediaPreview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={mediaPreview} className="w-full h-full object-cover" alt="Preview" />
              )
            ) : (
              <div className="text-center text-neutral-500">
                <Upload size={28} className="mx-auto mb-2" />
                <p className="text-sm">Click to upload image or video</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

          <div className="relative">
            <input
              value={mediaUrlInput}
              onChange={(e) => { setMediaUrlInput(e.target.value); setMediaPreview(e.target.value); }}
              placeholder="Or paste media URL (image or video link)"
              className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500"
              data-testid="input-media-url"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setType("image")}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-sm font-medium transition-colors ${type === "image" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"}`}
              data-testid="button-type-image"
            >
              <Image size={16} /> Image
            </button>
            <button
              onClick={() => setType("video")}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border text-sm font-medium transition-colors ${type === "video" ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"}`}
              data-testid="button-type-video"
            >
              <Video size={16} /> Video
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500"
            data-testid="input-name"
          />
          <div className="flex gap-3">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand"
              className="flex-1 p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500"
              data-testid="input-brand"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              className="w-28 p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500"
              data-testid="input-price"
            />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500 resize-none"
            data-testid="input-description"
          />
          <input
            value={qrUrl}
            onChange={(e) => setQrUrl(e.target.value)}
            placeholder="QR Code URL (e.g. https://example.com/product)"
            className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500"
            data-testid="input-qr-url"
          />
          <input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="Sort order (0 = first)"
            type="number"
            className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:border-blue-500"
            data-testid="input-sort-order"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={saving || !name || !brand}
            className="w-full h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            data-testid="button-save-ad"
          >
            <Save size={16} className="mr-2" />
            {saving ? "Saving..." : ad ? "Update Ad" : "Create Ad"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [editingAd, setEditingAd] = useState<Ad | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: ads = [], isLoading } = useQuery<Ad[]>({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const res = await fetch("/api/ads");
      if (!res.ok) throw new Error("Failed to load ads");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setDeletingId(null);
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/ads"] });

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              data-testid="button-back-home"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Ad Manager</h1>
              <p className="text-neutral-400 text-sm">{ads.length} ads in carousel</p>
            </div>
          </div>
          <Button
            onClick={() => { setEditingAd(undefined); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-500 rounded-full px-5"
            data-testid="button-add-ad"
          >
            <Plus size={16} className="mr-2" /> Add Ad
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-neutral-500">Loading ads...</div>
        ) : ads.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image size={28} className="text-neutral-600" />
            </div>
            <p className="text-neutral-400 mb-4">No ads yet. Add your first ad to get started.</p>
            <Button
              onClick={() => { setEditingAd(undefined); setShowForm(true); }}
              className="bg-blue-600 hover:bg-blue-500 rounded-full px-5"
            >
              <Plus size={16} className="mr-2" /> Add First Ad
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <motion.div
                key={ad.id}
                layout
                className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors"
                data-testid={`card-ad-${ad.id}`}
              >
                <div className="text-neutral-600">
                  <GripVertical size={18} />
                </div>

                <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                  {ad.type === "video" ? (
                    <video src={ad.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={ad.mediaUrl} className="w-full h-full object-cover" alt={ad.name} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white truncate">{ad.name}</h3>
                    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${ad.type === "video" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {ad.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-sm truncate">{ad.brand} {ad.price && `· ${ad.price}`}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setEditingAd(ad); setShowForm(true); }}
                    className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                    data-testid={`button-edit-ad-${ad.id}`}
                  >
                    <Pencil size={14} />
                  </button>
                  {deletingId === ad.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(ad.id)}
                        className="px-3 h-9 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors"
                        data-testid={`button-confirm-delete-${ad.id}`}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-3 h-9 rounded-lg bg-neutral-800 text-neutral-400 text-xs hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(ad.id)}
                      className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      data-testid={`button-delete-ad-${ad.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <AdForm
            ad={editingAd}
            onClose={() => setShowForm(false)}
            onSaved={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

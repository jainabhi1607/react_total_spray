"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLoading } from "@/components/ui/loading";

export default function PublicSupportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const accessToken = params.accessToken as string;
  const preselectedAssetId = searchParams.get("assetId") || "";
  const preselectedSiteId = searchParams.get("siteId") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNo, setTicketNo] = useState<number | null>(null);

  // Form state
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [productionImpact, setProductionImpact] = useState("1");
  const [timeHH, setTimeHH] = useState("");
  const [timeMM, setTimeMM] = useState("");
  const [timeAmPm, setTimeAmPm] = useState("AM");
  const [description, setDescription] = useState("");
  const [newRequesterMode, setNewRequesterMode] = useState(false);
  const [newRequesterName, setNewRequesterName] = useState("");
  const [newRequesterEmail, setNewRequesterEmail] = useState("");
  const [newRequesterPhone, setNewRequesterPhone] = useState("");

  // File upload
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Job Cards";
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/support/${accessToken}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        // Auto-select site and asset from URL params
        if (preselectedSiteId) {
          setSelectedSiteId(preselectedSiteId);
        }
        if (preselectedAssetId) {
          setSelectedAssetId(preselectedAssetId);
          // If no siteId in URL, find it from the asset
          if (!preselectedSiteId) {
            const asset = json.data.assets?.find((a: any) => a._id === preselectedAssetId);
            if (asset?.clientSiteId) {
              setSelectedSiteId(typeof asset.clientSiteId === "object" ? asset.clientSiteId._id : asset.clientSiteId);
            }
          }
        }
      } else {
        setError(json.error || "Invalid access link");
      }
    } catch {
      setError("Failed to load form data");
    } finally {
      setLoading(false);
    }
  }, [accessToken, preselectedAssetId, preselectedSiteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter assets by selected site
  const filteredAssets =
    data?.assets?.filter(
      (a: any) => !selectedSiteId || String(a.clientSiteId) === selectedSiteId
    ) || [];

  // Filter contacts by selected site (site contacts + general contacts with no site)
  const filteredContacts =
    data?.contacts?.filter(
      (c: any) => !selectedSiteId || !c.clientSiteId || String(c.clientSiteId) === selectedSiteId
    ) || [];

  function handleSiteChange(siteId: string) {
    setSelectedSiteId(siteId);
    setSelectedAssetId("");
    setSelectedContactId("");
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "image/jpeg" || f.type === "image/png"
    );
    setFiles((prev) => [...prev, ...dropped].slice(0, 3));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter(
      (f) => f.type === "image/jpeg" || f.type === "image/png"
    );
    setFiles((prev) => [...prev, ...selected].slice(0, 3));
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedSiteId) { setError("Please select a site"); return; }
    if (!selectedAssetId) { setError("Please select an asset"); return; }
    if (!newRequesterMode && !selectedContactId) { setError("Please select a requester"); return; }
    if (newRequesterMode && !newRequesterName.trim()) { setError("Please enter requester name"); return; }
    if (!description.trim()) { setError("Please enter a description"); return; }

    // Validate file sizes (max 8MB each)
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 8MB limit`);
        return;
      }
    }

    setSubmitting(true);

    try {
      let finalContactId = selectedContactId;

      // Create new contact if in new requester mode
      if (newRequesterMode) {
        const contactRes = await fetch(`/api/public/support/${accessToken}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createContact",
            name: newRequesterName.trim(),
            email: newRequesterEmail.trim() || undefined,
            phone: newRequesterPhone.trim() || undefined,
            clientSiteId: selectedSiteId,
          }),
        });
        const contactJson = await contactRes.json();
        if (!contactRes.ok || !contactJson.success) {
          throw new Error(contactJson.error || "Failed to create contact");
        }
        finalContactId = contactJson.data._id;
      }

      // Build time string
      let timeIssueOccurred = "";
      if (timeHH && timeMM) {
        timeIssueOccurred = `${timeHH}:${timeMM} ${timeAmPm}`;
      }

      const res = await fetch(`/api/public/support/${accessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSiteId: selectedSiteId,
          clientAssetId: selectedAssetId,
          clientContactId: finalContactId,
          description: description.trim(),
          productionImpact: Number(productionImpact),
          timeIssueOccurred: timeIssueOccurred || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        setTicketNo(json.data.ticketNo);
      } else {
        setError(json.error || "Failed to submit ticket");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#2B3540] flex flex-col items-center justify-center p-4">
        <CheckCircle2 className="h-16 w-16 text-green-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-3">Thank you!</h2>
        <p className="text-gray-300 mb-2">Your support ticket has been submitted successfully.</p>
        {ticketNo && (
          <p className="text-lg font-semibold text-[#00AEEF]">Ticket #{ticketNo}</p>
        )}
        <p className="text-sm text-gray-500 mt-6">
          Our team will review your request and get back to you as soon as possible.
        </p>
      </div>
    );
  }

  const { client, sites } = data;

  const selectClass = "w-full h-10 rounded-[10px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer";
  const inputClass = "w-full h-10 rounded-[10px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500";

  return (
    <div className="min-h-screen bg-[#2B3540]">
      {/* Logo */}
      <div className="max-w-[1000px] mx-auto px-6 py-6">
        <Image src="/logo.svg" alt="Total Spray Care" width={124} height={40} />
      </div>

      {/* Form Card */}
      <div className="max-w-[1000px] mx-auto px-6 mb-8">
        <div className="bg-white rounded-[10px] p-8">
        <h1 className="text-xl font-bold text-[#00AEEF] mb-1">Lodge Support Request</h1>
        <p className="text-sm text-gray-500 mb-8">
          You are lodging a support request for {client?.companyName || "your company"}.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Step 1 - Site */}
          <h2 className="text-base font-bold text-gray-900 mb-3">Step 1 - Select your site.</h2>
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">
              Site <span className="text-cyan-500">(required)</span>
            </label>
            <select className={selectClass} style={{ maxWidth: 380 }} value={selectedSiteId} onChange={(e) => handleSiteChange(e.target.value)}>
              <option value="">Select</option>
              {sites?.map((site: any) => (
                <option key={site._id} value={site._id}>{site.siteName}</option>
              ))}
            </select>
          </div>

          {/* Step 2 - Asset */}
          <h2 className="text-base font-bold text-gray-900 mb-3">Step 2 - Select the asset in question.</h2>
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">
              Asset <span className="text-cyan-500">(required)</span>
            </label>
            <select className={selectClass} style={{ maxWidth: 380 }} value={selectedAssetId} onChange={(e) => setSelectedAssetId(e.target.value)}>
              <option value="">Select</option>
              {filteredAssets.map((asset: any) => (
                <option key={asset._id} value={asset._id}>
                  {asset.machineName}{asset.serialNo ? ` (${asset.serialNo})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Step 3 - Requester */}
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Step 3 - Select existing requesters in the dropdown or press &quot;New Requester&quot; to add a new contact.
          </h2>
          <div className="mb-6">
            {!newRequesterMode ? (
              <>
                <label className="block text-sm text-gray-600 mb-1">
                  Select Requester <span className="text-cyan-500">(required)</span>
                </label>
                <select className={selectClass} style={{ maxWidth: 380 }} value={selectedContactId} onChange={(e) => setSelectedContactId(e.target.value)}>
                  <option value="">Select</option>
                  {filteredContacts.map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.lastName ? ` ${c.lastName}` : ""}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <button type="button" onClick={() => setNewRequesterMode(true)} className="text-sm text-[#00AEEF] underline cursor-pointer">
                    New Requester?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3" style={{ maxWidth: 380 }}>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Name <span className="text-cyan-500">(required)</span>
                    </label>
                    <input className={inputClass} value={newRequesterName} onChange={(e) => setNewRequesterName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input className={inputClass} type="email" value={newRequesterEmail} onChange={(e) => setNewRequesterEmail(e.target.value)} placeholder="Email address" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input className={inputClass} value={newRequesterPhone} onChange={(e) => setNewRequesterPhone(e.target.value)} placeholder="Phone number" />
                  </div>
                </div>
                <button type="button" onClick={() => { setNewRequesterMode(false); setNewRequesterName(""); setNewRequesterEmail(""); setNewRequesterPhone(""); }} className="text-sm text-[#00AEEF] underline mt-2 cursor-pointer">
                  Select existing requester
                </button>
              </>
            )}
          </div>

          {/* Step 4 - Supporting info */}
          <h2 className="text-base font-bold text-gray-900 mb-3">Step 4 - Add any supporting information such as photos and issue description.</h2>
          <div className="mb-6 space-y-4">
            {/* Production Impact + Time */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1" style={{ minWidth: 200 }}>
                <label className="block text-sm text-gray-600 mb-1">Production Impact</label>
                <select className={selectClass} value={productionImpact} onChange={(e) => setProductionImpact(e.target.value)}>
                  <option value="1">Low impact / Low urgency</option>
                  <option value="2">Medium impact / Medium urgency</option>
                  <option value="3">High impact / High urgency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Time issue occured</label>
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    style={{ width: 70 }}
                    placeholder="HH"
                    value={timeHH}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (v === "" || (Number(v) >= 0 && Number(v) <= 12)) setTimeHH(v);
                    }}
                    maxLength={2}
                  />
                  <span className="text-gray-400 font-bold">:</span>
                  <input
                    className={inputClass}
                    style={{ width: 70 }}
                    placeholder="MM"
                    value={timeMM}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                      if (v === "" || (Number(v) >= 0 && Number(v) <= 59)) setTimeMM(v);
                    }}
                    maxLength={2}
                  />
                  <select className={selectClass} style={{ width: 80 }} value={timeAmPm} onChange={(e) => setTimeAmPm(e.target.value)}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Description of issue (symptoms) <span className="text-cyan-500">(required)</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="rounded-[10px]"
              />
            </div>

            {/* File upload */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">Please upload any supporting evidence (up to 3 photos)</p>
              <p className="text-xs text-gray-500 mb-3">Max file size: 8MB. Max. files: 3.</p>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {files.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="h-20 w-20 object-cover rounded-[10px] border border-gray-200" />
                      <button type="button" onClick={() => removeFile(i)} className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs cursor-pointer">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length < 3 && (
                <div
                  className="rounded-[10px] border-2 border-dashed border-[#00AEEF] p-8 text-center bg-[#f0faff] cursor-pointer hover:bg-[#e5f6ff] transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm text-gray-600 mb-2">Drag & drop multiple documents (JPG or PNG only) to upload at once or</p>
                  <button type="button" className="bg-[#00AEEF] text-white px-4 py-1.5 rounded-[10px] text-sm font-medium cursor-pointer hover:bg-[#0098d4]">
                    Select Files
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleFileSelect} />
                </div>
              )}
            </div>
          </div>

          {/* Step 5 - Submit */}
          <h2 className="text-base font-bold text-gray-900 mb-2">Step 5 - Press Submit Support Request.</h2>
          <p className="text-sm text-gray-500 mb-4">A copy of this support request will be sent to the requesters email address.</p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#00AEEF] hover:bg-[#0098d4] text-white rounded-[10px] px-6 py-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit Support Request
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}

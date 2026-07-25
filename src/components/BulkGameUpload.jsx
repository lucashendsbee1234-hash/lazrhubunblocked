import React, { useState, useEffect, useRef } from 'react';
import { extractIframeUrl, deriveTitleFromUrl, generateSmartGameMetadata } from '../utils/storage';
import {
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Edit3,
  Loader2,
  Image,
  Tag,
  Gamepad2,
  Play,
  RotateCcw,
  Copy,
  ChevronDown,
} from 'lucide-react';

const BULK_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25, 50];

const createEmptyCard = (id) => ({
  id,
  iframeCode: '',
  thumbnailUrl: '',
  overrideTitle: '',
  overrideDescription: '',
  overrideCategory: '',
  overrideTags: '',
  overrideControls: '',
  // Auto-detected / generated fields
  autoMetadata: null, // { title, description, category, tags, controls, iframeSrc }
  isAnalyzing: false,
  analysisError: '',
  imageError: false,
  hasValidated: false,
  isValid: true,
});

export const BulkGameUpload = ({
  categories = [],
  existingGames = [],
  onAddGame,
  onUpdateGame,
  currentUser,
  onOpenGame,
  onEditGameInAdmin,
}) => {
  const [selectedCount, setSelectedCount] = useState(3);
  const [cards, setCards] = useState(() => Array.from({ length: 3 }, (_, i) => createEmptyCard(`card-${i + 1}`)));

  // Uploading Process State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, percentage: 0, currentTitle: '' });
  const [uploadLogs, setUploadLogs] = useState([]);
  const [uploadSummary, setUploadSummary] = useState(null); // { successCount, failCount, uploadedGames: [] }
  
  // Duplicate Modal State
  const [duplicateModal, setDuplicateModal] = useState(null); // { gameData, existingGame, cardIndex, resolvePromise }

  // Adjust card count when dropdown changes
  const handleCountChange = (newCount) => {
    setSelectedCount(newCount);
    setCards((prevCards) => {
      if (prevCards.length === newCount) return prevCards;
      if (prevCards.length < newCount) {
        const added = Array.from({ length: newCount - prevCards.length }, (_, i) =>
          createEmptyCard(`card-${prevCards.length + i + 1}`)
        );
        return [...prevCards, ...added];
      } else {
        return prevCards.slice(0, newCount);
      }
    });
  };

  // Update field for a specific card
  const handleCardChange = (index, field, value) => {
    setCards((prev) => {
      const next = [...prev];
      const updatedCard = { ...next[index], [field]: value };

      if (field === 'thumbnailUrl') {
        updatedCard.imageError = false;
      }

      next[index] = updatedCard;
      return next;
    });

    // If iframe code changed, trigger automatic metadata analysis
    if (field === 'iframeCode' && value.trim()) {
      analyzeCardIframe(index, value.trim());
    }
  };

  // Analyze Iframe and Auto-Generate Metadata using Gemini API endpoint
  const analyzeCardIframe = async (index, iframeCode) => {
    const extractedSrc = extractIframeUrl(iframeCode);
    if (!extractedSrc) return;

    // Smart metadata extraction for immediate instant response
    const smartMeta = generateSmartGameMetadata(extractedSrc);

    setCards((prev) => {
      const next = [...prev];
      const card = next[index];
      if (!card) return prev;

      next[index] = {
        ...card,
        isAnalyzing: true,
        analysisError: '',
        autoMetadata: {
          title: smartMeta.title,
          category: smartMeta.category,
          description: smartMeta.description,
          controls: smartMeta.controls,
          tags: smartMeta.tags,
          iframeSrc: extractedSrc,
        },
        overrideTitle: card.overrideTitle || smartMeta.title,
        overrideCategory: card.overrideCategory || smartMeta.category,
        overrideDescription: card.overrideDescription || smartMeta.description,
        overrideControls: card.overrideControls || smartMeta.controls,
        overrideTags: card.overrideTags || smartMeta.tagsString,
      };
      return next;
    });

    try {
      const res = await fetch('/api/analyze-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iframeSrc: extractedSrc, iframeCode }),
      });

      const data = await res.json();
      if (data.success && data.metadata) {
        setCards((prev) => {
          const next = [...prev];
          const card = next[index];
          if (!card) return prev;

          const meta = data.metadata;
          const aiTitle = meta.title;
          const finalTitle = (aiTitle && aiTitle !== 'Web Game' && aiTitle !== 'Untitled' && aiTitle !== 'New Game')
            ? aiTitle
            : smartMeta.title;

          next[index] = {
            ...card,
            isAnalyzing: false,
            autoMetadata: {
              ...meta,
              title: finalTitle,
              iframeSrc: extractedSrc,
            },
            overrideTitle: (!card.overrideTitle || card.overrideTitle === smartMeta.title) ? finalTitle : card.overrideTitle,
            overrideCategory: (!card.overrideCategory || card.overrideCategory === smartMeta.category) ? (meta.category || smartMeta.category) : card.overrideCategory,
            overrideDescription: (!card.overrideDescription || card.overrideDescription === smartMeta.description) ? (meta.description || smartMeta.description) : card.overrideDescription,
            overrideControls: (!card.overrideControls || card.overrideControls === smartMeta.controls) ? (meta.controls || smartMeta.controls) : card.overrideControls,
            overrideTags: (!card.overrideTags || card.overrideTags === smartMeta.tagsString) ? (Array.isArray(meta.tags) ? meta.tags.join(', ') : meta.tags || smartMeta.tagsString) : card.overrideTags,
          };
          return next;
        });
      } else {
        throw new Error(data.error || 'Failed to analyze metadata');
      }
    } catch (err) {
      console.warn('AI analysis fallback for card:', index, err);
      setCards((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index].isAnalyzing = false;
        }
        return next;
      });
    }
  };

  // Helper slug generator
  const createSlug = (title, src) => {
    if (title && title.trim()) {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const cleanSrc = extractIframeUrl(src);
    return deriveTitleFromUrl(cleanSrc).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  };

  // Validate all cards before upload
  const validateCards = () => {
    let validCount = 0;
    let invalidCount = 0;

    const validated = cards.map((card) => {
      const src = extractIframeUrl(card.iframeCode);
      const hasIframe = Boolean(src);
      const hasThumb = Boolean(card.thumbnailUrl.trim());
      const isValid = hasIframe && hasThumb;

      if (isValid) validCount++;
      else invalidCount++;

      return {
        ...card,
        hasValidated: true,
        isValid,
      };
    });

    setCards(validated);
    return { validatedCards: validated, validCount, invalidCount };
  };

  // Duplicate Check Helper
  const checkDuplicate = (gamePayload) => {
    const cleanSrc = gamePayload.iframe_src.toLowerCase().replace(/\/$/, '');
    const cleanSlug = gamePayload.slug;

    return existingGames.find((existing) => {
      const existingSrc = (existing.iframe_src || extractIframeUrl(existing.iframeUrl) || '')
        .toLowerCase()
        .replace(/\/$/, '');
      const existingSlug = existing.slug || createSlug(existing.title, existingSrc);

      return (cleanSrc && existingSrc && cleanSrc === existingSrc) || (cleanSlug && existingSlug && cleanSlug === existingSlug);
    });
  };

  // Main Upload All Handler
  const handleUploadAll = async () => {
    const { validatedCards, validCount, invalidCount } = validateCards();

    const validCardsToUpload = validatedCards.filter((c) => c.isValid);

    if (validCardsToUpload.length === 0) {
      alert('No valid game cards to upload. Please make sure every card has an iframe code and a thumbnail URL.');
      return;
    }

    setIsUploading(true);
    setUploadLogs([]);
    setUploadSummary(null);

    const totalToUpload = validCardsToUpload.length;
    let successfulUploaded = [];
    let skippedCount = 0;
    let replacedCount = 0;

    for (let i = 0; i < totalToUpload; i++) {
      const card = validCardsToUpload[i];
      const extractedSrc = extractIframeUrl(card.iframeCode);

      // Determine computed values
      const title = card.overrideTitle.trim() || card.autoMetadata?.title || deriveTitleFromUrl(extractedSrc);
      const category = card.overrideCategory || card.autoMetadata?.category || categories[0]?.name || 'Arcade';
      const description = card.overrideDescription.trim() || card.autoMetadata?.description || `${title} on LAZRHUB.`;
      const controls = card.overrideControls.trim() || card.autoMetadata?.controls || 'WASD / Arrow keys to play';
      
      let tagsArray = [];
      if (card.overrideTags.trim()) {
        tagsArray = card.overrideTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      } else if (card.autoMetadata?.tags && Array.isArray(card.autoMetadata.tags)) {
        tagsArray = card.autoMetadata.tags;
      } else {
        tagsArray = ['unblocked', 'web', 'arcade'];
      }

      const slug = createSlug(title, extractedSrc);
      const gameId = `game-${slug}-${Date.now().toString(36)}`;

      const gamePayload = {
        id: gameId,
        title,
        description,
        iframe: card.iframeCode,
        iframeUrl: extractedSrc,
        iframe_src: extractedSrc,
        thumbnail: card.thumbnailUrl.trim(),
        thumbnailUrl: card.thumbnailUrl.trim(),
        category,
        tags: tagsArray,
        controls,
        featured: false,
        isFeatured: false,
        hidden: false,
        createdBy: currentUser?.email || 'LAZRHUB Admin',
        author: currentUser?.email ? currentUser.email.split('@')[0] : 'LAZRHUB Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slug,
        status: 'published',
        plays: 0,
        rating: 0,
        ratingCount: 0,
        ratingSum: 0,
      };

      setUploadProgress({
        current: i + 1,
        total: totalToUpload,
        percentage: Math.round(((i + 1) / totalToUpload) * 100),
        currentTitle: title,
      });

      setUploadLogs((prev) => [...prev, `Uploading Game ${i + 1}: "${title}"...`]);

      // Check for duplicates
      const existingDuplicate = checkDuplicate(gamePayload);

      if (existingDuplicate) {
        setUploadLogs((prev) => [...prev, `⚠️ Duplicate found for "${title}"!`]);

        // Prompt user choice for duplicate resolution
        const userChoice = await new Promise((resolve) => {
          setDuplicateModal({
            gamePayload,
            existingGame: existingDuplicate,
            cardIndex: i + 1,
            resolve,
          });
        });

        setDuplicateModal(null);

        if (userChoice === 'cancel') {
          setUploadLogs((prev) => [...prev, `❌ Upload process cancelled by user.`]);
          break;
        } else if (userChoice === 'skip') {
          skippedCount++;
          setUploadLogs((prev) => [...prev, `⏩ Skipped duplicate: "${title}"`]);
          continue;
        } else if (userChoice === 'replace') {
          replacedCount++;
          gamePayload.id = existingDuplicate.id; // Keep existing ID
          await onUpdateGame(gamePayload);
          successfulUploaded.push(gamePayload);
          setUploadLogs((prev) => [...prev, `✔ Replaced existing game: "${title}"`]);
          continue;
        }
      }

      // Save new game
      try {
        await onAddGame(gamePayload);
        successfulUploaded.push(gamePayload);
        setUploadLogs((prev) => [...prev, `✔ Successfully uploaded: "${title}"`]);
      } catch (err) {
        console.error('Error uploading game:', title, err);
        setUploadLogs((prev) => [...prev, `❌ Failed to upload "${title}": ${err.message || 'Error'}`]);
      }
    }

    setIsUploading(false);
    setUploadSummary({
      successCount: successfulUploaded.length,
      failCount: invalidCount,
      skippedCount,
      replacedCount,
      uploadedGames: successfulUploaded,
    });
  };

  const handleResetBulkUpload = () => {
    setUploadSummary(null);
    setUploadLogs([]);
    setCards(Array.from({ length: selectedCount }, (_, i) => createEmptyCard(`card-${i + 1}`)));
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Dropdown Control */}
      <div className="p-5 rounded-3xl bg-slate-950/80 border border-purple-900/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-extrabold text-white tracking-tight">Bulk Game Importer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Paste iframe embed codes and let AI auto-extract titles, descriptions, categories, controls, and tags.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label htmlFor="bulk-count" className="text-xs font-bold text-purple-300 shrink-0">
            How many games would you like to upload?
          </label>
          <div className="relative">
            <select
              id="bulk-count"
              value={selectedCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              disabled={isUploading}
              className="appearance-none bg-slate-900 border border-purple-800/60 rounded-xl px-4 py-2 pr-9 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer shadow-inner"
            >
              {BULK_OPTIONS.map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Game' : 'Games'}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-purple-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Duplicate Resolution Modal Dialog */}
      {duplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-white">This game already exists</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A game with the title <span className="font-bold text-purple-300">"{duplicateModal.gamePayload.title}"</span> or iframe URL already exists in your catalog.
            </p>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center space-x-3 text-xs">
              <img
                src={duplicateModal.gamePayload.thumbnail}
                alt="preview"
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
              />
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{duplicateModal.gamePayload.title}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{duplicateModal.gamePayload.iframe_src}</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">How would you like to proceed?</p>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => duplicateModal.resolve('skip')}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Skip
              </button>
              <button
                onClick={() => duplicateModal.resolve('replace')}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
              >
                Replace Existing
              </button>
              <button
                onClick={() => duplicateModal.resolve('cancel')}
                className="py-2.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900/80 text-red-300 border border-red-800/50 text-xs font-bold transition-colors"
              >
                Cancel Bulk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploading Progress Screen */}
      {isUploading && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-purple-600/60 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <span className="text-sm font-extrabold text-white">
                Uploading {uploadProgress.current} of {uploadProgress.total}...
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-purple-400">{uploadProgress.percentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-purple-900/50 p-0.5">
            <div
              className="bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 h-full rounded-full transition-all duration-300 shadow-lg shadow-purple-500/50"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>

          <p className="text-xs text-purple-300/90 font-medium">
            Currently processing: <span className="font-bold text-white">"{uploadProgress.currentTitle}"</span>
          </p>

          {/* Real-time Logs Console */}
          <div className="p-3 bg-black/80 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-300">
            {uploadLogs.map((log, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="text-purple-500">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Summary / Results Screen */}
      {uploadSummary && !isUploading && (
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-emerald-500/50 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">Bulk Upload Process Completed</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                ✔ Successfully uploaded <span className="font-bold text-emerald-400">{uploadSummary.successCount} games</span>.
                {uploadSummary.failCount > 0 && (
                  <span className="text-red-400 font-bold ml-2">❌ {uploadSummary.failCount} failed validation.</span>
                )}
                {uploadSummary.skippedCount > 0 && (
                  <span className="text-amber-400 font-bold ml-2">⏩ {uploadSummary.skippedCount} skipped duplicates.</span>
                )}
              </p>
            </div>

            <button
              onClick={handleResetBulkUpload}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Import More Games</span>
            </button>
          </div>

          {/* Uploaded Games Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Game Cards</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uploadSummary.uploadedGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-3 flex flex-col justify-between space-y-3 group hover:border-purple-500/60 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={game.thumbnail}
                      alt={game.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Uploaded</span>
                      </div>
                      <h5 className="text-xs font-bold text-white truncate">{game.title}</h5>
                      <span className="text-[10px] text-purple-300 font-medium block truncate">{game.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                    {onOpenGame && (
                      <button
                        onClick={() => onOpenGame(game)}
                        className="flex-1 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800/50 text-[11px] font-bold flex items-center justify-center space-x-1 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Open Game</span>
                      </button>
                    )}
                    {onEditGameInAdmin && (
                      <button
                        onClick={() => onEditGameInAdmin(game)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center transition-colors"
                        title="Edit Game"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List of Dynamic Upload Cards */}
      {!uploadSummary && (
        <div className="space-y-6">
          {cards.map((card, index) => {
            const extractedSrc = extractIframeUrl(card.iframeCode);
            const computedTitle = card.overrideTitle.trim() || card.autoMetadata?.title || (extractedSrc ? deriveTitleFromUrl(extractedSrc) : 'Untitled Game');
            const computedCategory = card.overrideCategory || card.autoMetadata?.category || categories[0]?.name || 'Arcade';
            const computedDescription = card.overrideDescription.trim() || card.autoMetadata?.description || 'Auto-generated game description will appear here after iframe code is pasted.';
            const computedControls = card.overrideControls.trim() || card.autoMetadata?.controls || 'WASD / Arrow Keys';
            const computedTags = card.overrideTags.trim()
              ? card.overrideTags.split(',').map((t) => t.trim())
              : card.autoMetadata?.tags || ['arcade', 'unblocked', 'web'];

            const isInvalid = card.hasValidated && !card.isValid;

            return (
              <div
                key={card.id}
                className={`p-5 rounded-3xl bg-slate-900/90 border transition-all duration-200 shadow-xl space-y-5 relative overflow-hidden ${
                  isInvalid
                    ? 'border-red-500/90 ring-2 ring-red-500/40 bg-red-950/20'
                    : 'border-purple-900/40 hover:border-purple-700/60'
                }`}
              >
                {/* Card Header Tag */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-900/60 border border-purple-700/50 flex items-center justify-center text-xs font-mono font-bold text-purple-300">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-extrabold text-white">
                      Game Card #{index + 1}
                    </h3>
                  </div>

                  {card.isAnalyzing ? (
                    <div className="flex items-center space-x-2 text-xs font-bold text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/50">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI Analyzing iFrame...</span>
                    </div>
                  ) : isInvalid ? (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-800/60">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missing Required iFrame or Thumbnail</span>
                    </div>
                  ) : (
                    card.hasValidated && (
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Upload</span>
                      </div>
                    )
                  )}
                </div>

                {/* Form Input Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: Embed & Thumbnail */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider block mb-1.5">
                        iFrame Embed Code <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={card.iframeCode}
                        onChange={(e) => handleCardChange(index, 'iframeCode', e.target.value)}
                        placeholder='<iframe src="https://example.com/games/slope/index.html"></iframe>'
                        rows={3}
                        className={`w-full bg-slate-950 border rounded-2xl p-3 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none transition-colors ${
                          isInvalid && !extractIframeUrl(card.iframeCode)
                            ? 'border-red-500'
                            : 'border-slate-800 focus:border-purple-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider block mb-1.5">
                        Thumbnail Cover Image URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={card.thumbnailUrl}
                        onChange={(e) => handleCardChange(index, 'thumbnailUrl', e.target.value)}
                        placeholder="https://images.unsplash.com/photo-1550745165-9bc0b252726f..."
                        className={`w-full bg-slate-950 border rounded-2xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                          isInvalid && !card.thumbnailUrl.trim()
                            ? 'border-red-500'
                            : 'border-slate-800 focus:border-purple-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Right Column: Optional Overrides */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Optional Override Title
                        </label>
                        <input
                          type="text"
                          value={card.overrideTitle}
                          onChange={(e) => handleCardChange(index, 'overrideTitle', e.target.value)}
                          placeholder={card.autoMetadata?.title || 'Auto-detected'}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Optional Override Category
                        </label>
                        <select
                          value={card.overrideCategory}
                          onChange={(e) => handleCardChange(index, 'overrideCategory', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white focus:outline-none cursor-pointer"
                        >
                          <option value="">Auto-Detect ({card.autoMetadata?.category || 'Arcade'})</option>
                          {categories.map((cat) => (
                            <option key={cat.id || cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">
                        Optional Override Description
                      </label>
                      <textarea
                        value={card.overrideDescription}
                        onChange={(e) => handleCardChange(index, 'overrideDescription', e.target.value)}
                        placeholder={card.autoMetadata?.description || 'Auto-generated game description...'}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Optional Override Tags (comma separated)
                        </label>
                        <input
                          type="text"
                          value={card.overrideTags}
                          onChange={(e) => handleCardChange(index, 'overrideTags', e.target.value)}
                          placeholder="arcade, 3d, skill, runner"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">
                          Optional Override Controls
                        </label>
                        <input
                          type="text"
                          value={card.overrideControls}
                          onChange={(e) => handleCardChange(index, 'overrideControls', e.target.value)}
                          placeholder="Arrow Keys or WASD"
                          className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-2 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Preview Card Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-900/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider">
                    <span className="flex items-center space-x-1.5">
                      <Gamepad2 className="w-4 h-4" />
                      <span>Live Game Preview</span>
                    </span>
                    {extractedSrc && (
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                        {extractedSrc}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Thumbnail Image Live Preview */}
                    <div className="md:col-span-3 aspect-video bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
                      {card.thumbnailUrl.trim() && !card.imageError ? (
                        <img
                          src={card.thumbnailUrl.trim()}
                          alt="Thumbnail preview"
                          onError={() => handleCardChange(index, 'imageError', true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                          <Image className="w-6 h-6 mb-1 opacity-50" />
                          <span className="text-[10px] font-bold">No preview available</span>
                        </div>
                      )}
                    </div>

                    {/* Meta Preview Information */}
                    <div className="md:col-span-9 space-y-1.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-black text-white truncate">{computedTitle}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/50 text-purple-300 border border-purple-700/40 shrink-0">
                          {computedCategory}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{computedDescription}</p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                          <span>Controls:</span>
                          <span className="font-mono text-purple-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {computedControls}
                          </span>
                        </span>

                        <span className="text-slate-600">•</span>

                        <div className="flex flex-wrap gap-1">
                          {computedTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-800"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bottom Upload Action Button */}
          <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-900/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">
                Ready to publish {cards.length} game cards to LAZRHUB?
              </p>
              <p className="text-[11px] text-slate-400">
                Invalid cards will be automatically highlighted and skipped during submission.
              </p>
            </div>

            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-extrabold shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2.5 transition-all transform active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Upload All Games ({cards.length})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

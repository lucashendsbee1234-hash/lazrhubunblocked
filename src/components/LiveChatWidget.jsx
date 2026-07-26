import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Shield,
  ShieldAlert,
  Pin,
  Trash2,
  Clock,
  Ban,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  User,
  Settings,
  MoreVertical,
  Flag,
  CheckCircle,
  Volume2,
  VolumeX,
  Smile,
  Zap,
} from 'lucide-react';
import { evaluateMessageSafety, formatChatTimestamp } from '../utils/chatModerator';

const AVATAR_OPTIONS = ['🎮', '⚡', '👾', '🐉', '🚀', '💎', '👑', '🔥', '🦊', '🤖', '🎯', '🐱'];

export const LiveChatWidget = ({
  currentUser,
  messages = [],
  moderation = {},
  onSendMessage,
  onDeleteMessage,
  onClearChat,
  onSaveModeration,
  onReportMessage,
  onOpenAuth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMsgId, setLastReadMsgId] = useState('');
  
  // User Chat Profile state
  const [userNickname, setUserNickname] = useState(currentUser?.username || 'Gamer');
  const [userAvatar, setUserAvatar] = useState('🎮');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Moderation state
  const [lastSentTimestamp, setLastSentTimestamp] = useState(0);
  const [slowModeCountdown, setSlowModeCountdown] = useState(0);
  const [aiWarning, setAiWarning] = useState('');
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modal / Sub-views inside chat
  const [reportModalData, setReportModalData] = useState(null);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportSuccess, setReportSuccess] = useState('');

  const messagesEndRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';
  const userEmail = currentUser?.email || 'guest@lazrhub.com';

  // Check if current user is banned or timed out
  const isBanned = (moderation?.bannedEmails || []).includes(userEmail.toLowerCase());
  
  const timeoutUntilStr = (moderation?.timedOutUsers || {})[userEmail.toLowerCase()];
  const isTimedOut = Boolean(
    timeoutUntilStr && new Date(timeoutUntilStr).getTime() > Date.now()
  );

  // Auto-scroll to bottom on new message if chat is open
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
      if (messages.length > 0) {
        setLastReadMsgId(messages[messages.length - 1].id);
      }
    } else {
      if (messages.length > 0 && messages[messages.length - 1].id !== lastReadMsgId) {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isOpen]);

  // Handle Slow mode countdown timer tick
  useEffect(() => {
    let timer;
    if (slowModeCountdown > 0) {
      timer = setInterval(() => {
        setSlowModeCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [slowModeCountdown]);

  // Keep nickname synced with auth user
  useEffect(() => {
    if (currentUser?.username) {
      setUserNickname(currentUser.username);
    }
  }, [currentUser]);

  const handleSend = (e) => {
    e.preventDefault();
    setAiWarning('');

    if (!inputText.trim()) return;

    if (isBanned) {
      setAiWarning('You are currently banned from sending messages in Live Chat.');
      return;
    }

    if (isTimedOut) {
      const timeoutEnd = new Date(timeoutUntilStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAiWarning(`You are timed out until ${timeoutEnd}.`);
      return;
    }

    // Check Slow Mode
    const slowModeSec = moderation?.slowModeSeconds || 0;
    if (slowModeSec > 0 && !isAdmin) {
      const timeSinceLast = Math.floor((Date.now() - lastSentTimestamp) / 1000);
      if (timeSinceLast < slowModeSec) {
        setSlowModeCountdown(slowModeSec - timeSinceLast);
        setAiWarning(`Slow Mode is active. Please wait ${slowModeSec - timeSinceLast}s before sending another message.`);
        return;
      }
    }

    // AI Automated Moderation Evaluation
    if (moderation?.aiModerationEnabled !== false) {
      const evaluation = evaluateMessageSafety(inputText, userEmail);
      if (!evaluation.allowed) {
        setAiWarning(evaluation.reason || 'Message blocked by AI Moderation.');
        
        // If critical harassment or slurs, auto issue a 3-minute timeout if enabled
        if (evaluation.severity === 'high' || evaluation.severity === 'critical') {
          const timeoutTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
          const updatedTimeouts = {
            ...(moderation.timedOutUsers || {}),
            [userEmail.toLowerCase()]: timeoutTime,
          };
          onSaveModeration({
            ...moderation,
            timedOutUsers: updatedTimeouts,
          });
          
          // Send system warning
          onSendMessage({
            text: `🤖 AI Moderation auto-timed out ${userNickname} for 3 minutes for violating chat safety rules.`,
            userEmail: 'system@lazrhub.com',
            userName: 'AI System',
            userAvatar: '🤖',
            userRole: 'system',
            isSystemMsg: true,
          });
        }
        return;
      }
    }

    // Determine user role badge
    let role = 'user';
    if (isAdmin) role = 'admin';
    else if (currentUser) role = 'member';
    else role = 'guest';

    // Dispatch message to Firestore
    onSendMessage({
      text: inputText.trim(),
      userEmail,
      userName: userNickname || 'Gamer',
      userAvatar: userAvatar || '🎮',
      userRole: role,
      timestamp: new Date().toISOString(),
    });

    setInputText('');
    setLastSentTimestamp(Date.now());
    if (slowModeSec > 0) setSlowModeCountdown(slowModeSec);
  };

  // Admin Actions
  const handlePinMessage = (msg) => {
    onSaveModeration({
      ...moderation,
      pinnedMessage: msg,
    });
    setActiveMenuMsgId(null);
  };

  const handleUnpinMessage = () => {
    onSaveModeration({
      ...moderation,
      pinnedMessage: null,
    });
  };

  const handleTimeoutUser = (msgUserEmail, msgUserName, durationMinutes = 5) => {
    if (!msgUserEmail) return;
    const timeoutUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const updatedTimeouts = {
      ...(moderation.timedOutUsers || {}),
      [msgUserEmail.toLowerCase()]: timeoutUntil,
    };
    onSaveModeration({
      ...moderation,
      timedOutUsers: updatedTimeouts,
    });

    // Post system message
    onSendMessage({
      text: `⏱️ Admin timed out ${msgUserName} for ${durationMinutes} minutes.`,
      userEmail: 'system@lazrhub.com',
      userName: 'System',
      userAvatar: '🛡️',
      userRole: 'system',
      isSystemMsg: true,
    });
    setActiveMenuMsgId(null);
  };

  const handleBanUser = (msgUserEmail, msgUserName) => {
    if (!msgUserEmail) return;
    const currentBanned = moderation?.bannedEmails || [];
    if (currentBanned.includes(msgUserEmail.toLowerCase())) return;

    const updatedBanned = [...currentBanned, msgUserEmail.toLowerCase()];
    onSaveModeration({
      ...moderation,
      bannedEmails: updatedBanned,
    });

    onSendMessage({
      text: `🚫 Admin banned ${msgUserName} from Live Chat.`,
      userEmail: 'system@lazrhub.com',
      userName: 'System',
      userAvatar: '🛡️',
      userRole: 'system',
      isSystemMsg: true,
    });
    setActiveMenuMsgId(null);
  };

  const handleSubmitReport = () => {
    if (!reportModalData) return;
    onReportMessage({
      messageId: reportModalData.id,
      messageText: reportModalData.text,
      reportedUserEmail: reportModalData.userEmail,
      reportedUserName: reportModalData.userName,
      reason: reportReason,
    });
    setReportSuccess('Report submitted to admins. Thank you!');
    setTimeout(() => {
      setReportSuccess('');
      setReportModalData(null);
    }, 1500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      
      {/* Expanded Live Chat Panel */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 h-[540px] max-h-[80vh] rounded-3xl bg-slate-950 border border-purple-800/60 shadow-2xl shadow-purple-950/90 flex flex-col overflow-hidden text-slate-100 animate-fadeIn transition-all">
          
          {/* Chat Top Header */}
          <div className="p-3.5 bg-slate-900/90 border-b border-purple-900/40 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-black text-white tracking-tight">LAZRHUB Live Chat</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {moderation?.aiModerationEnabled !== false ? '🤖 AI Moderation Active' : 'Public Gamer Chat'}
                </p>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors"
                title="Customize Chat Nickname & Avatar"
              >
                <User className="w-3.5 h-3.5" />
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showAdminMenu
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-purple-300'
                  }`}
                  title="Admin Moderation Controls"
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Admin Moderation Drawer */}
          {isAdmin && showAdminMenu && (
            <div className="p-3 bg-purple-950/80 border-b border-purple-800/60 text-xs space-y-2.5 animate-fadeIn shrink-0">
              <div className="flex items-center justify-between text-purple-200 font-bold">
                <span className="flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Live Moderation Controls</span>
                </span>
                <button
                  onClick={() => setShowAdminMenu(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* AI Mod Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onSaveModeration({
                      ...moderation,
                      aiModerationEnabled: !moderation.aiModerationEnabled,
                    })
                  }
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-colors ${
                    moderation?.aiModerationEnabled !== false
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span>AI Content Filter</span>
                  <span className="font-black">{moderation?.aiModerationEnabled !== false ? 'ON' : 'OFF'}</span>
                </button>

                {/* Slow Mode Selector */}
                <div className="flex items-center space-x-1 bg-slate-900 border border-purple-900/50 rounded-xl px-2 py-1">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] text-slate-300">Slow:</span>
                  <select
                    value={moderation?.slowModeSeconds || 0}
                    onChange={(e) =>
                      onSaveModeration({
                        ...moderation,
                        slowModeSeconds: Number(e.target.value),
                      })
                    }
                    className="bg-transparent text-[11px] font-bold text-purple-300 focus:outline-none cursor-pointer"
                  >
                    <option value={0} className="bg-slate-900">Off</option>
                    <option value={3} className="bg-slate-900">3s</option>
                    <option value={5} className="bg-slate-900">5s</option>
                    <option value={10} className="bg-slate-900">10s</option>
                    <option value={30} className="bg-slate-900">30s</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all chat message history for all users?')) {
                      onClearChat();
                    }
                  }}
                  className="w-full py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900/90 text-red-200 border border-red-800/50 font-bold text-[11px] flex items-center justify-center space-x-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  <span>Purge Chat History</span>
                </button>
              </div>
            </div>
          )}

          {/* User Profile Customizer Sub-Drawer */}
          {isEditingProfile && (
            <div className="p-3 bg-slate-900 border-b border-purple-900/40 text-xs space-y-3 shrink-0 animate-fadeIn">
              <div className="flex items-center justify-between text-purple-200 font-bold">
                <span>Customize Chat Identity</span>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Done
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400">Chat Nickname:</label>
                <input
                  type="text"
                  value={userNickname}
                  onChange={(e) => setUserNickname(e.target.value)}
                  maxLength={20}
                  placeholder="Enter nickname..."
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-purple-900/50 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Choose Avatar Emoji:</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setUserAvatar(emoji)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-transform ${
                        userAvatar === emoji
                          ? 'bg-purple-600 scale-110 shadow-md shadow-purple-600/40'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pinned Message Banner */}
          {moderation?.pinnedMessage && (
            <div className="p-2.5 bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border-b border-purple-800/40 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-start space-x-2 overflow-hidden text-xs">
                <Pin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5 rotate-45" />
                <div className="truncate">
                  <span className="font-bold text-purple-300 mr-1.5">
                    {moderation.pinnedMessage.userName}:
                  </span>
                  <span className="text-slate-200">{moderation.pinnedMessage.text}</span>
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleUnpinMessage}
                  className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                  title="Unpin message"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Chat Messages Feed Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-purple-500/40" />
                <p className="text-xs font-bold text-slate-400">Welcome to LAZRHUB Live Chat!</p>
                <p className="text-[11px] text-slate-500">
                  Be the first gamer to send a message. Keep it friendly!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMyMessage = msg.userEmail?.toLowerCase() === userEmail.toLowerCase();
                const isSys = msg.isSystemMsg;

                if (isSys) {
                  return (
                    <div
                      key={msg.id}
                      className="py-1 px-3 rounded-full bg-purple-950/40 border border-purple-800/30 text-center text-[11px] text-purple-300 font-medium my-1"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`group relative flex space-x-2 items-start ${
                      isMyMessage ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="w-7 h-7 rounded-xl bg-slate-800 border border-purple-900/50 flex items-center justify-center text-sm shrink-0 shadow-sm">
                      {msg.userAvatar || '🎮'}
                    </div>

                    {/* Message Content Bubble */}
                    <div className={`max-w-[78%] space-y-0.5 ${isMyMessage ? 'items-end' : ''}`}>
                      <div className="flex items-center space-x-1.5 text-[10px] px-1">
                        <span className="font-bold text-slate-300 truncate">{msg.userName}</span>
                        
                        {msg.userRole === 'admin' && (
                          <span className="px-1 py-0.2 rounded bg-purple-600 text-white font-black text-[9px] uppercase">
                            ADMIN
                          </span>
                        )}

                        <span className="text-slate-500">{formatChatTimestamp(msg.timestamp)}</span>
                      </div>

                      <div
                        className={`p-2.5 rounded-2xl text-xs leading-relaxed break-words relative ${
                          isMyMessage
                            ? 'bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                            : 'bg-slate-900 text-slate-100 rounded-tl-none border border-purple-900/40'
                        }`}
                      >
                        {msg.text}

                        {/* Context Menu Trigger */}
                        <div
                          className={`absolute top-1 ${
                            isMyMessage ? '-left-6' : '-right-6'
                          } opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)
                            }
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Action Menu for Message */}
                      {activeMenuMsgId === msg.id && (
                        <div className="mt-1 p-1.5 bg-slate-900 border border-purple-800/60 rounded-xl shadow-xl z-20 text-[11px] space-y-1 animate-fadeIn">
                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePinMessage(msg)}
                                className="w-full px-2 py-1 rounded-lg hover:bg-purple-900/50 text-purple-300 font-bold flex items-center space-x-1.5 text-left"
                              >
                                <Pin className="w-3 h-3" />
                                <span>Pin Message</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTimeoutUser(msg.userEmail, msg.userName, 5)}
                                className="w-full px-2 py-1 rounded-lg hover:bg-amber-900/50 text-amber-300 font-bold flex items-center space-x-1.5 text-left"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Timeout User (5m)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleBanUser(msg.userEmail, msg.userName)}
                                className="w-full px-2 py-1 rounded-lg hover:bg-red-950 text-red-400 font-bold flex items-center space-x-1.5 text-left"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Ban User</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteMessage(msg.id);
                                  setActiveMenuMsgId(null);
                                }}
                                className="w-full px-2 py-1 rounded-lg hover:bg-red-900/60 text-red-300 font-bold flex items-center space-x-1.5 text-left"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Message</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReportModalData(msg);
                                setActiveMenuMsgId(null);
                              }}
                              className="w-full px-2 py-1 rounded-lg hover:bg-slate-800 text-amber-300 font-bold flex items-center space-x-1.5 text-left"
                            >
                              <Flag className="w-3 h-3" />
                              <span>Report Message</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* AI Warning or Status Banner */}
          {aiWarning && (
            <div className="px-3 py-2 bg-amber-950/80 border-t border-amber-800/60 text-amber-300 text-xs font-bold flex items-start space-x-2 shrink-0 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span className="flex-1">{aiWarning}</span>
              <button onClick={() => setAiWarning('')} className="text-amber-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Chat Input Section */}
          <div className="p-3 bg-slate-900/90 border-t border-purple-900/40 shrink-0">
            <form onSubmit={handleSend} className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (aiWarning) setAiWarning('');
                  }}
                  disabled={isBanned || isTimedOut}
                  maxLength={500}
                  placeholder={
                    isBanned
                      ? 'You are banned from Live Chat'
                      : isTimedOut
                      ? 'You are currently timed out'
                      : slowModeCountdown > 0
                      ? `Slow Mode active (${slowModeCountdown}s)...`
                      : 'Type a message...'
                  }
                  className="w-full pl-3 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-purple-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || isBanned || isTimedOut || slowModeCountdown > 0}
                  className="absolute right-1.5 p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white disabled:text-slate-600 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Quick Row */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>AI Moderated Chat</span>
                </span>

                <span>{inputText.length}/500</span>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative group p-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-2xl shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all duration-200 border border-purple-400/40 flex items-center space-x-2"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="hidden sm:inline-block font-extrabold text-sm tracking-tight pr-1">
            Live Chat
          </span>

          {/* Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] shadow-lg animate-bounce border border-red-400">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Live Pulse Indicator */}
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900"></span>
          </span>
        </button>
      )}

      {/* Report Modal Popup */}
      {reportModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-purple-900/60 text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Flag className="w-4 h-4 text-amber-400" />
                <span>Report Chat Message</span>
              </h4>
              <button
                onClick={() => setReportModalData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl text-center">
                {reportSuccess}
              </div>
            ) : (
              <>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="font-bold text-purple-300">{reportModalData.userName}:</span>
                  <p className="text-slate-300 italic">"{reportModalData.text}"</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-bold">Reason for report:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-purple-900/50 text-xs text-white focus:outline-none"
                  >
                    <option value="Inappropriate Content">Inappropriate Content</option>
                    <option value="Hate Speech or Slurs">Hate Speech or Slurs</option>
                    <option value="Harassment or Bullying">Harassment or Bullying</option>
                    <option value="Spam or Links">Spam or Links</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalData(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

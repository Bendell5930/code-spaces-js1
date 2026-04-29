import { useState, useRef, useEffect, useCallback } from 'react'
import {
  getProfile,
  updateProfile,
  loadChat,
  postMessage,
  addReaction,
  subscribeChat,
  REACTIONS,
} from '../lib/communityStore'
import { moderateMessage, reportUser } from '../lib/chatModeration'
import { playTap, playSuccess, playWarn } from '../lib/sounds'
import styles from './CommunityHub.module.css'
import hmStyles from './HarmMinimization.module.css'

const REPORT_REASONS = [
  'Harassment or abusive language',
  'Financial solicitation / loan sharking',
  'Sharing personal or location information',
  'Spam or scam content',
  'Other inappropriate behaviour',
]

export default function ChatForum() {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [profile, setProfile] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [moderationMsg, setModerationMsg] = useState('')
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [reportDone, setReportDone] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    setProfile(getProfile())
    setMessages(loadChat())
    // Subscribe to live updates (Realtime hydration + other browsers' messages)
    const unsubscribe = subscribeChat((msgs) => setMessages(msgs))
    return unsubscribe
  }, [])

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  function handleSend() {
    const text = draft.trim()
    if (!text) return
    // Moderate the message before posting
    const check = moderateMessage(text)
    if (!check.allowed) {
      playWarn()
      setModerationMsg(check.reason)
      setTimeout(() => setModerationMsg(''), 4000)
      return
    }
    const updated = postMessage(text)
    setMessages(updated)
    setDraft('')
    setModerationMsg('')
    playSuccess()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleReaction(msgId, emoji) {
    const updated = addReaction(msgId, emoji)
    setMessages(updated)
    playTap()
  }

  function handleSaveName() {
    const name = nameInput.trim()
    if (name && name.length >= 2 && name.length <= 20) {
      const updated = updateProfile({ name })
      setProfile(updated)
      setEditingName(false)
      playSuccess()
    }
  }

  function handleReport(msg) {
    setReportTarget(msg)
    setReportReason('')
    setReportDone(false)
  }

  function handleSubmitReport() {
    if (!reportTarget || !reportReason) return
    reportUser(reportTarget.userId, reportTarget.userName, reportTarget.id, reportReason)
    setReportDone(true)
    playSuccess()
    setTimeout(() => {
      setReportTarget(null)
      setReportDone(false)
    }, 2000)
  }

  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return d.toLocaleDateString()
  }

  if (!profile) return null

  return (
    <div className={styles.chatWrap}>
      {/* Profile header */}
      <div className={styles.profileBar}>
        <span className={styles.profileAvatar}>{profile.avatar}</span>
        {editingName ? (
          <div className={styles.nameEdit}>
            <input
              className={styles.nameInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={20}
              placeholder="New nickname…"
              autoFocus
            />
            <button className={styles.nameBtn} onClick={handleSaveName}>✓</button>
            <button className={styles.nameBtn} onClick={() => setEditingName(false)}>✕</button>
          </div>
        ) : (
          <button
            className={styles.profileName}
            onClick={() => { setNameInput(profile.name); setEditingName(true) }}
            title="Tap to change nickname"
          >
            {profile.name} ✏️
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={styles.messageList} ref={listRef}>
        {messages.length === 0 && (
          <div className={styles.emptyChat}>
            <span className={styles.emptyChatEmoji}>💬</span>
            <p>No messages yet. Be the first to say g&apos;day!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === profile.id
          return (
            <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.msgRowMe : ''}`}>
              <div className={styles.msgBubble} style={isMe ? { background: '#1e3a5f' } : {}}>
                <div className={styles.msgHeader}>
                  <span className={styles.msgAvatar}>{msg.userAvatar}</span>
                  <span className={styles.msgName} style={isMe ? { color: '#38bdf8' } : {}}>
                    {isMe ? 'You' : msg.userName}
                  </span>
                  <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                </div>
                <p className={styles.msgText}>{msg.text}</p>
                {/* Reactions */}
                <div className={styles.reactions}>
                  {msg.reactions && Object.entries(msg.reactions).map(([emoji, count]) => (
                    count > 0 && (
                      <button
                        key={emoji}
                        className={styles.reactionBadge}
                        onClick={() => handleReaction(msg.id, emoji)}
                      >
                        {emoji} {count}
                      </button>
                    )
                  ))}
                  <div className={styles.reactionPicker}>
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        className={styles.reactionBtn}
                        onClick={() => handleReaction(msg.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  {!isMe && (
                    <button
                      className={styles.reactionBtn}
                      onClick={() => handleReport(msg)}
                      title="Report this user"
                      style={{ marginLeft: '0.3rem', opacity: 0.4 }}
                    >
                      🚩
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className={styles.chatInput}>
        <textarea
          className={styles.chatTextarea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something… (Enter to send)"
          rows={1}
          maxLength={500}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!draft.trim()}
        >
          🚀
        </button>
      </div>

      {/* Moderation blocked message */}
      {moderationMsg && (
        <div className={hmStyles.moderationBlocked}>
          🚫 {moderationMsg}
        </div>
      )}

      {/* Report User Modal */}
      {reportTarget && (
        <div className={hmStyles.reportOverlay}>
          <div className={hmStyles.reportCard}>
            {reportDone ? (
              <div className={hmStyles.reportSuccess}>
                ✅ Report submitted. Thank you for keeping the community safe.
              </div>
            ) : (
              <>
                <h3 className={hmStyles.reportTitle}>🚩 Report User</h3>
                <p className={hmStyles.reportUser}>
                  Reporting: {reportTarget.userAvatar} {reportTarget.userName}
                </p>
                <div className={hmStyles.reportReasons}>
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      className={`${hmStyles.reportReasonBtn} ${reportReason === reason ? hmStyles.reportReasonActive : ''}`}
                      onClick={() => setReportReason(reason)}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <div className={hmStyles.reportActions}>
                  <button
                    className={hmStyles.reportSubmit}
                    disabled={!reportReason}
                    onClick={handleSubmitReport}
                  >
                    Submit Report
                  </button>
                  <button
                    className={hmStyles.reportCancel}
                    onClick={() => setReportTarget(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

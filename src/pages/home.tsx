import "../styles/home.sass";
import Menu from "../components/menu";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createMeeting } from "../services/meetingService";
import { getAuth } from "firebase/auth";

const Home = () => {
  // Controls whether the sidebar menu is open
  const [openMenu, setOpenMenu] = useState(false);

  // Stores the meeting code generated or entered by the user
  const [meetingCode, setMeetingCode] = useState("");

  // Controls the visibility of the modal that appears after creating a meeting
  const [showModal, setShowModal] = useState(false);

  // Indicates whether the meeting code was copied to clipboard
  const [copied, setCopied] = useState(false);

  // Indicates whether the meeting link was shared
  const [shared, setShared] = useState(false);

  const navigate = useNavigate();

  // Handles meeting creation using Firebase authentication and backend API
  const handleCreateMeeting = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // User must be logged in to create a meeting
      if (!user) return alert("⚠ You must sign in to create a meeting");

      // Get Firebase ID token to authenticate backend request
      const token = await user.getIdToken();

      // Request new meeting creation from backend
      const meeting = await createMeeting(
        user.uid,
        user.displayName || "Anonymous",
        token
      );

      // Save meeting ID and open modal
      setMeetingCode(meeting.id);
      setShowModal(true);
      setCopied(false);
      setShared(false);
    } catch (e) {
      console.error("Error creating meeting:", e);
      alert("❌ Error creating meeting");
    }
  };

  // Copies the meeting code to the user’s clipboard
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(meetingCode);

      setCopied(true);

      // Reset copy indicator after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);
      alert("Could not copy the code");
    }
  };

  // Shares the meeting link using Web Share API, WhatsApp, or fallback copy
  const handleShare = async () => {
    const url = `${window.location.origin}/room/${meetingCode}`;
    const text = `Join my meeting on UVMeet: ${meetingCode}\n${url}`;

    // 1️⃣ Try native Web Share API (mobile or supported browsers)
    if (navigator.share) {
      try {
        await navigator.share({ title: "UVMeet Meeting", text, url });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err) {
        console.warn("Web Share failed or was canceled:", err);
      }
    }

    // 2️⃣ Try sharing through WhatsApp
    try {
      const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsapp, "_blank");
      setShared(true);
      setTimeout(() => setShared(false), 2000);
      return;
    } catch (err) {
      console.warn("Could not open WhatsApp:", err);
    }

    // 3️⃣ Fallback: copy link manually
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard. Share it anywhere you want.");
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error("Link copy failed:", err);
      alert("Could not share the link. Copy manually: " + url);
    }
  };

  return (
    <div
      className="home-container"
      onClick={() => openMenu && setOpenMenu(false)}
    >
      {/* HEADER */}
      <header className="home-header">
        <div className="header-left">
          {/* Menu button */}
          <button
            className="hamburger-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(!openMenu);
            }}
          >
            ☰
          </button>

          {/* Sidebar menu component */}
          <Menu open={openMenu} setOpen={setOpenMenu} />

          {/* Site logo */}
          <img
            src="/images/uvmeet-removebg-preview.png"
            alt="UVMeet Logo"
            className="logo"
          />
        </div>

        {/* Top navigation links */}
        <nav className="navbar">
          <Link to="/about">about us</Link>
          <Link to="/sitemap">site map</Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="home-main">
        <h1 className="main-title">
          Secure <br /> video conferences for everyone
        </h1>

        <p className="main-subtitle">
          connect and collaborate with whoever you want on uv meet
        </p>

        {/* Section for creating or joining a meeting */}
        <div className="action-section">
          <p className="question">What do you want to do?</p>

          <div className="actions">
            {/* Button to create a new meeting */}
            <button className="create-btn" onClick={handleCreateMeeting}>
              create meeting
            </button>

            {/* Input for joining an existing meeting */}
            <input
              type="text"
              placeholder="enter the code"
              className="room-input"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
            />

            {/* Button to join a meeting */}
            <button
              className="join-btn"
              onClick={() => {
                if (!meetingCode.trim())
                  return alert("Enter a valid code");
                navigate(`/room/${meetingCode}`);
              }}
            >
              join
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-divider"></div>
        <h3>Site map</h3>

        <div className="footer-columns">
          <div>
            <p><strong>ACCESS</strong></p>
            <p>Sign in</p>
            <p>Create account</p>
            <p>Recover password</p>
          </div>

          <div>
            <p><strong>ACCOUNT & SUPPORT</strong></p>
            <p>Edit profile</p>
            <p>About us</p>
            <p>Contact</p>
          </div>

          <div>
            <p><strong>NAVIGATION</strong></p>
            <p>Home</p>
            <p>About us</p>
            <p>Meetings</p>
          </div>

          <div>
            <p><strong>CONTACT</strong></p>
            <p>uvmeet@gmail.com</p>
          </div>
        </div>
      </footer>

      {/* MODAL (Shown after meeting creation) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Meeting created</h2>

            <p className="modal-subtitle">This is your access code:</p>

            {/* Box containing the meeting code */}
            <div className="code-box">
              <span className="code">{meetingCode}</span>

              {/* Button to copy the code */}
              <button className="copy-btn" onClick={copyCode}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>

            {/* Button to share the meeting */}
            <button className="share-btn" onClick={handleShare}>
              {shared ? "✓ Shared" : "Share"}
            </button>

            {/* Close modal */}
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

import { useEffect, useRef } from "react";
import axios from "axios";
import { serverUrl } from "../App";

export default function useUsageTracker() {

  const sessionStart = useRef(Date.now());
  const isTabActive = useRef(true);
  const isIdle = useRef(false);
  const idleTimer = useRef(null);

  useEffect(() => {

    //console.log("🧠 Usage tracker started");

    const sendUsage = async () => {

      const now = Date.now();
      const diff = now - sessionStart.current;
      
      const minutes = Math.max(1, Math.floor(diff / 60000));

      if (minutes <= 0) {
        console.log("⏱ Not enough time yet:", diff);
        return;
      }

      try {

        //console.log("📡 Sending usage:", minutes);

        const res = await axios.post(
          `${serverUrl}/api/usage/update`,
          { minutes },
          { withCredentials: true }
        );

        //console.log("✅ usage saved", res.data);

        if (res.data.continuousUsageMinutes > 120) {
          alert("You have been studying for 2 hours. Take a short break!");
        }

        sessionStart.current = Date.now();

      } catch (err) {
        console.error("❌ usage tracking failed", err);
      }
    };

    // TAB VISIBILITY
    const handleVisibility = () => {

      if (document.hidden) {

        //console.log("🚫 Tab hidden → saving usage");

        sendUsage();
        isTabActive.current = false;

      } else {

        //console.log("👀 Tab active");

        sessionStart.current = Date.now();
        isTabActive.current = true;

      }

    };

    document.addEventListener("visibilitychange", handleVisibility);

    // IDLE DETECTION
    const resetIdleTimer = () => {

      if (isIdle.current) {
        //console.log("🟢 User active again");
        sessionStart.current = Date.now();
      }

      isIdle.current = false;

      clearTimeout(idleTimer.current);

      idleTimer.current = setTimeout(() => {

        //console.log("💤 User idle → saving usage");

        isIdle.current = true;
        sendUsage();

      }, 5 * 60 * 1000);

    };

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("scroll", resetIdleTimer);

    resetIdleTimer();

    // PERIODIC SAVE (every 5 min)
    const interval = setInterval(() => {

      if (!isTabActive.current) return;
      if (isIdle.current) return;

      sendUsage();

    }, 5 * 60 * 1000);

    return () => {

      sendUsage();

      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("scroll", resetIdleTimer);

    };

  }, []);
}
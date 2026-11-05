"use client";

// Opens a message thread at its newest message, as a phone does. Drop <ToEnd /> next to an SmsThread in a tour step.
import { useEffect, useRef } from "react";

export function ToEnd() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    ref.current
      ?.closest(".ph-step")
      ?.querySelectorAll<HTMLElement>(".ph-sms-body")
      .forEach((b) => {
        b.scrollTop = b.scrollHeight;
      });
  }, []);
  return <span ref={ref} hidden />;
}

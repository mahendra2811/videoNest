export type FaqItem = { question: string; answer: string };

/** FAQ shown on the home + tool pages and emitted as FAQPage JSON-LD. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Will it look exactly like the original?",
    answer:
      "No — and we won't pretend otherwise. WhatsApp always re-compresses Status videos. VideoNest prepares a clean, correctly-sized file so WhatsApp's pass does the least possible extra damage, keeping your video as sharp as possible.",
  },
  {
    question: "Do you upload my video?",
    answer:
      "Never. Everything happens inside your browser, on your device. Your video is never sent to a server — there's no upload, no account, and nothing for us to see or store.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes, completely free. No sign-up, no watermark, no limits on how many videos you optimize.",
  },
  {
    question: "Why does WhatsApp make my videos blurry?",
    answer:
      "When you post to Status, WhatsApp re-encodes the video, caps the size (around 16 MB) and downscales toward 720p. If your file isn't already prepared for that, the result looks soft. VideoNest gives WhatsApp an optimal starting point so it stays crisp.",
  },
  {
    question: "What's the best way to post it?",
    answer:
      "Upload from the WhatsApp mobile app, not WhatsApp Web — the web version compresses harder. On a phone you can tap Share and send it straight to your Status.",
  },
];

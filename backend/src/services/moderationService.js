function normalizeText(input) {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const moderationRules = [
  {
    category: "Ngôn từ xúc phạm",
    severity: "medium",
    phrases: ["thang ngu", "con cho", "suc vat", "thang khon", "do ngu", "dm ", "dit me", "deo me"],
  },
  {
    category: "Phân biệt chủng tộc",
    severity: "high",
    phrases: ["phan biet chung toc", "racist", "moi den", "da den", "nguoi da mau"],
  },
  {
    category: "Nội dung tình dục hoặc nhạy cảm",
    severity: "high",
    phrases: ["anh nong", "khoa than", "khoe than", "sex", "porn", "nude", "khieu dam"],
  },
  {
    category: "Bạo lực hoặc máu me",
    severity: "high",
    phrases: ["mau me", "xac chet", "giet", "chet choc", "chat dau", "tra tan", "dam mau"],
  },
];

const riskyImageNamePhrases = ["nude", "nsfw", "gore", "blood", "violent", "sex", "18+", "adult"];

function buildModerationRules(customRules = []) {
  return [
    ...moderationRules,
    ...customRules
      .filter((rule) => rule?.category && Array.isArray(rule.phrases) && rule.phrases.length)
      .map((rule) => ({
        category: rule.category,
        severity: rule.severity || "medium",
        phrases: rule.phrases,
      })),
  ];
}

function analyzePostModeration({ title = "", summary = "", content = "", imageOriginalName = "", customRules = [] }) {
  const combinedText = normalizeText(`${title} ${summary} ${content}`);
  const normalizedImageName = normalizeText(imageOriginalName);
  const reasons = [];
  let severity = "low";
  const activeRules = buildModerationRules(customRules);

  activeRules.forEach((rule) => {
    if (rule.phrases.some((phrase) => combinedText.includes(normalizeText(phrase)))) {
      reasons.push(rule.category);
      if (rule.severity === "high") {
        severity = "high";
      } else if (severity !== "high") {
        severity = "medium";
      }
    }
  });

  if (normalizedImageName && riskyImageNamePhrases.some((phrase) => normalizedImageName.includes(phrase))) {
    reasons.push("Tên file ảnh có dấu hiệu nhạy cảm");
    severity = "high";
  }

  return {
    status: reasons.length ? "pending" : "approved",
    severity,
    reasons: [...new Set(reasons)],
  };
}

module.exports = {
  analyzePostModeration,
  moderationRules,
  normalizeText,
};

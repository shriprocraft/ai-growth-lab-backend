import express from "express";
import cors from "cors";
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root
const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");

app.use(cors());
app.use(express.json());

// Serve React/Vite frontend
app.use(express.static(DIST_DIR));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Growth Lab analyzer is running",
  });
});

app.post("/api/analyze-website", async (req, res) => {
  let browser;

  try {
    const { url, businessName, location, category } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Website URL is required",
      });
    }

    let websiteUrl = url.trim();

    if (
      !websiteUrl.startsWith("http://") &&
      !websiteUrl.startsWith("https://")
    ) {
      websiteUrl = `https://${websiteUrl}`;
    }

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      viewport: {
        width: 1440,
        height: 900,
      },
    });

    const response = await page.goto(websiteUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    await page.waitForTimeout(1500);

    const evidence = await page.evaluate(
      ({ businessName, location, category }) => {
        const title = document.title.trim();

        const metaDescription =
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute("content")
            ?.trim() || "";

        const bodyText =
          document.body?.innerText?.replace(/\s+/g, " ").trim() || "";

        const pageText = bodyText.toLowerCase();

        const normalizeText = (value = "") =>
          value
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const normalizedPageText = pageText.replace(/\s+/g, " ");

        const normalizedBusinessName = normalizeText(businessName);
        const normalizedLocation = normalizeText(location);
        const normalizedCategory = normalizeText(category);

        const ctaKeywords = [
          "contact",
          "call",
          "book",
          "buy",
          "quote",
          "enquire",
          "enquiry",
          "whatsapp",
          "get started",
          "learn more",
          "request",
          "subscribe",
        ];

        const ctaPresent = ctaKeywords.some((keyword) =>
          pageText.includes(keyword)
        );

        const contactInfoPresent =
          /(\+?\d[\d\s().-]{7,}\d)/.test(bodyText) ||
          pageText.includes("email") ||
          pageText.includes("contact");

        const businessNamePresent =
          Boolean(normalizedBusinessName) &&
          normalizedPageText.includes(normalizedBusinessName);

        const locationPresent =
          Boolean(normalizedLocation) &&
          normalizedPageText.includes(normalizedLocation);

        const categoryPresent =
          Boolean(normalizedCategory) &&
          normalizedPageText.includes(normalizedCategory);

        const addressDetected =
          pageText.includes("address") ||
          pageText.includes("located") ||
          pageText.includes("location");

        const phoneDetected =
          /(\+?\d[\d\s().-]{7,}\d)/.test(bodyText);

        const mapsLinkDetected = Array.from(
          document.querySelectorAll("a")
        ).some((link) => {
          const href = link.getAttribute("href") || "";

          return (
            href.includes("google.com/maps") ||
            href.includes("maps.google") ||
            href.includes("goo.gl/maps")
          );
        });

        const testimonialsDetected =
          pageText.includes("testimonial") ||
          pageText.includes("client testimonial") ||
          pageText.includes("what our clients say");

        const reviewsDetected =
          pageText.includes("reviews") ||
          pageText.includes("customer reviews") ||
          pageText.includes("client reviews");

        const ratingsDetected =
          pageText.includes("rating") ||
          pageText.includes("ratings") ||
          pageText.includes("stars") ||
          pageText.includes("5 star") ||
          pageText.includes("5-star");

        const clientLogoAltTexts = Array.from(
          document.querySelectorAll("img")
        )
          .map((image) => image.getAttribute("alt") || "")
          .map((alt) => alt.toLowerCase());

        const clientLogosDetected =
          pageText.includes("clients") ||
          pageText.includes("brands") ||
          pageText.includes("partners") ||
          clientLogoAltTexts.filter((alt) =>
            /client|brand|partner|logo/.test(alt)
          ).length > 1;

        const awardsOrCertificationsDetected =
          pageText.includes("award") ||
          pageText.includes("awards") ||
          pageText.includes("certification") ||
          pageText.includes("certified") ||
          pageText.includes("accreditation") ||
          pageText.includes("accredited");

        const titlePresent = Boolean(title);
        const metaDescriptionPresent = Boolean(metaDescription);

        const headingsPresent = Array.from(
          document.querySelectorAll("h1, h2, h3")
        ).some((heading) => heading.textContent?.trim());

        const contentPresent = bodyText.length > 100;

        const internalLinksDetected = Array.from(
          document.querySelectorAll("a[href]")
        ).some((link) => {
          try {
            return (
              new URL(link.href, window.location.href).hostname ===
              window.location.hostname
            );
          } catch {
            return false;
          }
        });

        const socialLinks = Array.from(
          document.querySelectorAll("a[href]")
        ).map((link) => link.href.toLowerCase());

        const instagramDetected = socialLinks.some((href) =>
          href.includes("instagram.com")
        );

        const facebookDetected = socialLinks.some((href) =>
          href.includes("facebook.com")
        );

        const linkedinDetected = socialLinks.some((href) =>
          href.includes("linkedin.com")
        );

        const youtubeDetected = socialLinks.some(
          (href) =>
            href.includes("youtube.com") || href.includes("youtu.be")
        );

        const xDetected = socialLinks.some(
          (href) =>
            href.includes("x.com") || href.includes("twitter.com")
        );

        const conversionKeywords = [
          "get started",
          "contact us",
          "request a quote",
          "get quote",
          "book a call",
          "book now",
          "schedule",
          "enquire",
          "inquire",
          "start now",
          "learn more",
          "talk to us",
          "free consultation",
          "request demo",
          "get in touch",
        ];

        const primaryCtaDetected = conversionKeywords.some((keyword) =>
          pageText.includes(keyword)
        );

        const contactFormDetected = Boolean(
          document.querySelector(
            "form input, form textarea, form select"
          )
        );

        const phoneOrWhatsappDetected =
          Array.from(
            document.querySelectorAll(
              'a[href^="tel:"], a[href*="whatsapp"]'
            )
          ).length > 0 ||
          /(?:\+?\d[\d\s().-]{7,}\d)/.test(bodyText);

        const conversionPageKeywords = [
          "contact",
          "quote",
          "enquiry",
          "inquiry",
          "booking",
          "consultation",
          "appointment",
          "demo",
          "get-started",
        ];

        const conversionPageDetected = Array.from(
          document.querySelectorAll("a[href]")
        ).some((link) => {
          const href =
            link.getAttribute("href")?.toLowerCase() || "";

          return conversionPageKeywords.some((keyword) =>
            href.includes(keyword)
          );
        });

        const actionPathDetected = Array.from(
          document.querySelectorAll("a[href], button")
        ).some((element) => {
          const text =
            element.textContent?.toLowerCase().trim() || "";

          const href =
            element instanceof HTMLAnchorElement
              ? element.getAttribute("href")?.toLowerCase() || ""
              : "";

          return (
            conversionKeywords.some((keyword) =>
              text.includes(keyword)
            ) ||
            conversionPageKeywords.some((keyword) =>
              href.includes(keyword)
            )
          );
        });

        return {
          urlProvided: true,
          reachable: true,
          https: window.location.protocol === "https:",
          titlePresent,
          metaDescriptionPresent,
          headingsPresent,
          contentPresent,
          ctaPresent,
          contactInfoPresent,

          local: {
            businessNamePresent,
            locationPresent,
            addressDetected,
            categoryPresent,
            phoneDetected,
            mapsLinkDetected,
          },

          trust: {
            testimonialsDetected,
            reviewsDetected,
            ratingsDetected,
            clientLogosDetected,
            awardsOrCertificationsDetected,
          },

          search: {
            titlePresent,
            metaDescriptionPresent,
            headingsPresent,
            contentPresent,
            internalLinksDetected,
          },

          social: {
            instagramDetected,
            facebookDetected,
            linkedinDetected,
            youtubeDetected,
            xDetected,
          },

          conversion: {
            primaryCtaDetected,
            contactFormDetected,
            phoneOrWhatsappDetected,
            conversionPageDetected,
            actionPathDetected,
          },
        };
      },
      { businessName, location, category }
    );

    res.json({
      success: true,
      url: page.url(),
      statusCode: response?.status() ?? null,
      evidence,
    });
  } catch (error) {
    console.error("Website analysis error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to analyze the website",
      details:
        error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// React/Vite SPA fallback
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(
    `AI Growth Lab running on port ${PORT}`
  );
});
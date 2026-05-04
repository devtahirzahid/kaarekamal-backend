const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");

function resolveCloudFrontPublicBaseUrl() {
  return String(
    process.env.CLOUDFRONT_PUBLIC_BASE_URL ||
      process.env.AWS_CLOUDFRONT_PUBLIC_BASE_URL ||
      ""
  ).trim();
}

function resolveCloudFrontDomain() {
  return String(process.env.CLOUDFRONT_DOMAIN || "").trim();
}

function normalizePemKey(pem) {
  if (!pem) return "";
  // Vercel env vars often store newlines as "\n"
  return String(pem).replace(/\\n/g, "\n");
}

function extractKeyPathFromUrl(urlString) {
  try {
    const u = new URL(urlString);
    return u.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

function buildUnsignedCloudFrontUrl({ publicBaseUrl, domain, key }) {
  const base = String(publicBaseUrl || "").trim();
  if (base) return `${base.replace(/\/+$/, "")}/${key}`;

  const d = String(domain || "").trim();
  if (!d) return null;
  return `https://${d.replace(/^\/+/, "").replace(/\/+$/, "")}/${key}`;
}

function signCloudFrontUrlIfConfigured(urlString) {
  const domain = resolveCloudFrontDomain();
  const publicBaseUrl = resolveCloudFrontPublicBaseUrl();
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKey = normalizePemKey(process.env.CLOUDFRONT_PRIVATE_KEY_PEM);
  const ttlSeconds = Number(process.env.CLOUDFRONT_SIGNED_URL_TTL_SECONDS || 3600);

  if (!urlString) return urlString;
  if (!keyPairId || !privateKey) return urlString;

  const keyPath = extractKeyPathFromUrl(urlString);
  if (!keyPath) return urlString;

  const unsigned = buildUnsignedCloudFrontUrl({ publicBaseUrl, domain, key: keyPath });
  if (!unsigned) return urlString;

  const dateLessThan = new Date(Date.now() + Math.max(60, ttlSeconds) * 1000);

  try {
    return getSignedUrl({
      url: unsigned,
      keyPairId,
      privateKey,
      dateLessThan,
    });
  } catch {
    return urlString;
  }
}

function mapImageUrlForResponse(urlString) {
  if (!urlString) return urlString;
  // Only sign URLs that look like they belong to our CDN distribution/base.
  const domain = resolveCloudFrontDomain();
  const publicBase = resolveCloudFrontPublicBaseUrl();

  const s = String(urlString);
  const looksLikeOurs =
    (domain && s.includes(domain)) || (publicBase && s.startsWith(publicBase.replace(/\/+$/, "")));

  if (!looksLikeOurs) return urlString;

  // Always strip any existing query string before re-signing (DB should store unsigned CDN URLs).
  let unsigned = s;
  try {
    const u = new URL(s);
    u.search = "";
    unsigned = u.toString();
  } catch {
    // ignore
  }

  return signCloudFrontUrlIfConfigured(unsigned);
}

module.exports = {
  signCloudFrontUrlIfConfigured,
  mapImageUrlForResponse,
  resolveCloudFrontPublicBaseUrl,
  resolveCloudFrontDomain,
};

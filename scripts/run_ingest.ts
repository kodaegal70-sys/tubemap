import "dotenv/config";
import { KakaoBrowserScraper } from "../src/lib/v3/extractor/KakaoBrowserScraper";

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.log("사용법: npm run ingest:kakao -- https://place.map.kakao.com/16737435");
    process.exit(1);
  }

  console.log("[START]", target);

  const scraper: any = new KakaoBrowserScraper();
  console.log("[METHODS]", Object.getOwnPropertyNames(Object.getPrototypeOf(scraper)).sort());

  await scraper.init();
  const result = await scraper.getPlaceDetails(target);

  console.log("[DONE]");
  await scraper.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("[FATAL]", e);
  process.exit(1);
});



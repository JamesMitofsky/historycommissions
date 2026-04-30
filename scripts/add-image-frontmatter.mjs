import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

// Maps slug fragment → local image path
const IMAGE_MAP = {
  "2010-02-08-reports-of-the-china-japan-joint-history-study-released":
    "/images/China-Japan-History-Study-Released.jpg",
  "2010-03-30-reports-of-the-japan-korea-joint-history-study-released":
    "/images/Japan-Korea-Joint-History-Study.jpg",
  "2016-01-25-report-of-the-china-japan-joint-historical-study-finally-published-in-china-and-":
    "/images/China-Japan-Joint-History-Study.jpg",
  "2016-05-03-german-ukrainian-joint-historians-commission-met":
    "/images/German-Ukrainian-Joint-Commission-Meeting.jpg",
  "2016-05-13-publication-of-the-joint-japanese-russian-historians-group":
    "/images/Japanese-Russian-Historians-Publication.jpg",
  "2016-06-23-the-eighth-annual-meeting-of-the-russian-austrian-historians-commission":
    "/images/Russian-Austrian-Eighth-Meeting.jpg",
  "2017-12-21-german-ukrainian-historians-commission-held-3rd-annual-conference":
    "/images/German-Ukrainian-3rd-Annual-Conference.jpg",
  "2017-07-12-polish-russian-group-for-difficult-matters-resumes-its-activities-march-2017":
    "/images/Polish-Russian-Group-Difficult-Matters.jpg",
  "2018-04-20-major-study-of-historians-commissions-published":
    "/images/Historians-Commissions-Study.jpg",
  "2018-07-02-workshop-for-young-historians-from-ukraine-and-germany":
    "/images/Young-Historians-Ukraine-Germany-Workshop.jpg",
  "2018-07-10-21st-annual-meeting-of-german-russian-historians-commission":
    "/images/German-Russian-21st-Meeting-1.jpg",
  "2018-12-04-fourth-annual-german-ukrainian-historians-commission-meeting-held-in-munich":
    "/images/German-Ukrainian-4th-Meeting-Munich.jpg",
  "2019-07-12-22nd-annual-conference-of-russian-german-historians-commission-meets-in-voronezh":
    "/images/Russian-German-22nd-Conference-Voronezh.jpg",
  "2019-09-02-the-fifth-annual-conference-of-the-german-ukrainian-historians-commission":
    "/images/German-Ukrainian-5th-Annual-Conference.jpg",
  "2019-11-05-bulgaria-n-macedonia-joint-commission-on-historical-and-educational-issues-holds":
    "/images/Bulgaria-Macedonia-Joint-Commission.jpg",
  "2020-08-10-russian-austrian-historians-commission-publishes-joint-history-book":
    "/images/Russian-Austrian-Historians-Book.jpg",
  "2020-09-25-german-ukrainian-historians-commission-duhk-issues-statement":
    "/images/German-Ukrainian-Historians-Statement.jpg",
  "2021-06-08-russian-lithuanian-historians-commission-releases-joint-publication":
    "/images/Russian-Lithuanian-Historians-Commission.jpg",
  "2021-09-30-2021-annual-meeting-of-the-german-russian-historians-commission-took-place-onlin":
    "/images/2021-German-Russian-Historians-Commission.jpg",
  "2021-10-22-georgian-polish-commission-of-historians":
    "/images/Georgian-Polish-Commission-of-Historians.jpg",
  "2022-12-02-a-german-israeli-historians-commission-examines-attack-during-1972-olympics-in-m":
    "/images/munich-1972-olympics-historians-commission.jpg",
  "2024-01-11-france-algeria-first-meeting-of-the-commission-of-historians":
    "/images/france-algeria-commission-first-meeting.jpg",
  "2025-11-06-france-cameroon-memorial-committee-present-report-to-president-paul-biya":
    "/images/france-cameroon-memorial-committee-report.jpg",
};

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

for (const filename of files) {
  const slug = filename.replace(/\.md$/, "");
  const filePath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  if ("image" in data) {
    console.log(`SKIP (already has image): ${slug}`);
    continue;
  }

  const image = IMAGE_MAP[slug] ?? null;
  const newData = { ...data, image };

  const updated = matter.stringify(content, newData);
  fs.writeFileSync(filePath, updated, "utf8");
  console.log(`${image ? "SET " : "NULL"}: ${slug} → ${image ?? "null"}`);
}

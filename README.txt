עדכון טכני: דחיסה, אנגלית כברירת מחדל בקוד, תגיות, favicon

להעלות הכול יחד (לשמור על מבנה התיקיות):
- 6 קובצי ה-HTML (index, about, contact, work-b2b, work-dogether, work-mixmatch)
- css/style.css
- js/i18n.js, js/i18n-data.js
- assets/: 18 קובצי .webp חדשים + favicon-32.png

מה השתנה:
1. תמונות: PNG הומרו ל-WebP (כולם מתחת ל-300KB). שני PNG נשארו כי WebP יצא גדול יותר: dg-screen-celebrate ו-quiz-start-btn-keycap-en.
2. title ו-description באנגלית בכל העמודים, מתחלפים לעברית כשבוחרים "עב".
3. היפוך השפה: ה-HTML עצמו באנגלית (גם מה שרואים בלי JS, מה שבוטים וקוראי מסך מקבלים), והעברית נטענת מ-js/i18n-data.js רק כשבוחרים עברית. הטקסט בשתי השפות זהה לגמרי למה שהיה.
4. תגיות OG ו-Twitter בכל העמודים. שימי לב: בכל עמוד יש את הכתובת https://YOUR-DOMAIN.vercel.app, צריך להחליף אותה בכתובת האמיתית (ראי הודעה). תמונת OG עצמה (1200x630) נשארת אצלך: assets/og-image.png
5. favicon: assets/favicon-32.png מקושר מכל העמודים.
6. כרטיס Fashion Campaign הוסר מעמוד הבית (גם התרגום והעיצוב שלו).

אפשר למחוק מ-assets (כבר לא בשימוש): ה-PNG של כל מה שהומר ל-WebP:
b2b-sol1-after, b2b-sol1-before, b2b-sol2-after-newcontent, b2b-sol2-after-quickedit, b2b-sol3-after, b2b-sol3-before, b2b-sol4-after, b2b-sol4-before-plus, b2b-sol4-before-sidemenu, b2b-summary-home, contact-callme, cover-b2b-wireframe, cover-dogether, cover-fashion-campaign, cover-mixmatch, dg-process-child-screen, dg-process-parent-screen, dg-research-robot, mixmatch-logo
(כולם .png). וגם CHANGES.patch ו-README.txt שהועלו בטעות לשורש הריפו.

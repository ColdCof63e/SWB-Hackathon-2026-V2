import fetch from 'node-fetch'; // wait, does node-fetch exist? In Node 18+, fetch is global!
// Let's just use global fetch since Node 18+ is used.

async function test() {
  const feedUrl = 'https://weworkremotely.com/categories/remote-programming-jobs.rss';
  const res = await fetch(feedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });
  const xmlText = await res.text();
  const matches = xmlText.match(/<description>([\s\S]*?)<\/description>/g) || [];
  console.log("Total descriptions matched:", matches.length);
  for (let i = 0; i < Math.min(5, matches.length); i++) {
    console.log(`\n--- Item ${i} ---`);
    console.log(matches[i].substring(0, 400));
  }
}

test().catch(console.error);

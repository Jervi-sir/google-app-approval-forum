
import "dotenv/config"
import { db } from "../drizzle/db"
import { posts, comments, postLikes, postSaves } from "../drizzle/schema"

const profileIds = [
  "1d7ee886-22ae-46f4-a8c1-3e457fd981d6",
  "6cfa316c-85cd-4125-95bd-09684a1e1541",
  "c5c3c159-d09b-4a16-b055-925749c7130a",
]

const titles = [
  "Looking for testers for my new puzzle game",
  "Need 20 testers for 14 days, will test back",
  "Great community here, thanks for the help",
  "My app was rejected, need advice",
  "Production access granted! Here is how I did it",
  "Testers needed: RPG Adventure",
  "Exchange testing? I have 2 phones",
  "Google Play Console is confusing",
  "Finally published my first app",
  "Help with closed testing requirements",
  "Looking for feedback on UI/UX",
  "Bug in recent internal track release",
  "How to get more legitimate testers?",
  "Is it safe to pay for testers?",
  "My journey to 20 testers",
  "Strategy game needs balancing feedback",
  "Productivity app for students - beta test",
  "Fitness tracker app - early access",
  "Review my store listing please",
  "Icon design feedback needed"
]

const contents = [
  "Hi everyone, I just released a new update and I need some testers to verify the new features. I will test your app in return!",
  "I've been working on this for 6 months. It's a passion project. Please help me get through the 20 testers requirement.",
  "Google rejected my app due to policy violation but the message is vague. Has anyone faced this?",
  "I'm willing to test back immediately. Please drop your link in the comments.",
  "Just wanted to share a milestone. After 2 weeks of testing, I finally got access to production!",
  "Looking for people who like strategy games. It's a bit complex so I need detailed feedback.",
  "My app is a simple utility tool. Should be quick to test. Let me know if you are interested.",
  "Here is my google group link properly configured. Join and opt-in.",
  "I have 3 codes left for the premium version if anyone wants to test that specifically.",
  "Thanks to everyone who helped me last week. The bug is fixed."
]

const commentTexts = [
  "I can help! Here is my app link.",
  "Joined and opted in. Please test mine too.",
  "Congratulations on the launch!",
  "I faced the same issue. You need to update your privacy policy.",
  "Installing now. Will keep it for 14 days.",
  "Looks great! Good luck.",
  "Can you test my app as well?",
  "Sent you a DM.",
  "The UI looks a bit cluttered on small screens.",
  "Works perfectly on my Pixel 6."
]

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function seed() {
  console.log("🌱 Starting seed...")

  const createdPosts = []

  // Create 100 posts
  for (let i = 0; i < 100; i++) {
    const authorId = getRandomItem(profileIds)
    const title = `${getRandomItem(titles)} (${i + 1})`
    const content = getRandomItem(contents)

    // 50% chance to have a play store url or google group url
    const hasUrls = Math.random() > 0.5
    const playStoreUrl = hasUrls ? "https://play.google.com/store/apps/details?id=com.example.app" : null
    const googleGroupUrl = hasUrls ? "https://groups.google.com/g/example-testers" : null

    const [post] = await db.insert(posts).values({
      authorId,
      title,
      content,
      playStoreUrl,
      googleGroupUrl,
      moderationStatus: "ok",
      isDeleted: false,
    }).returning()

    createdPosts.push(post)
    process.stdout.write(".")
  }

  console.log(`\nCreated ${createdPosts.length} posts. Generating interactions...`)

  for (const post of createdPosts) {
    // Comments
    const numComments = getRandomInt(1, 5)
    for (let j = 0; j < numComments; j++) {
      await db.insert(comments).values({
        postId: post.id,
        authorId: getRandomItem(profileIds),
        content: getRandomItem(commentTexts),
        isDeleted: false
      })
    }

    // Likes (0 to 3)
    const shuffledProfilesForLikes = [...profileIds].sort(() => 0.5 - Math.random())
    const numLikes = getRandomInt(0, 3)
    for (let k = 0; k < numLikes; k++) {
      await db.insert(postLikes).values({
        postId: post.id,
        userId: shuffledProfilesForLikes[k]
      }).onConflictDoNothing() // Prevent duplicate key errors if logic fails (though logic is sound)
    }

    // Saves (0 to 3)
    const shuffledProfilesForSaves = [...profileIds].sort(() => 0.5 - Math.random())
    const numSaves = getRandomInt(0, 3)
    for (let l = 0; l < numSaves; l++) {
      await db.insert(postSaves).values({
        postId: post.id,
        userId: shuffledProfilesForSaves[l]
      }).onConflictDoNothing()
    }
  }

  console.log(`\n✅ Seeding complete!`)
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err)
  process.exit(1)
})

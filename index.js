import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const path = "./data.json";
const git = simpleGit();

const makeCommits = async () => {
  // 1. Read data.json to find the starting point
  let data = await jsonfile.readFile(path).catch(() => null);
  if (!data) {
    data = { date: "2025-01-01T00:00:00", streak: 0 };
  }

  // Parse the last commit date.
  // If existing data doesn't have 'streak', default it to 0.
  let lastDate = moment(data.date);
  let streakRemaining = data.streak || 0;

  // 2. Define the target range
  // Start from the day AFTER the last commit
  let currentDate = lastDate.clone().add(1, 'days');

  // End at Today (for backfilling) or continue naturally
  // But cap strictly at Dec 31, 2026 as per requirements
  const hardStopDate = moment("2026-12-31").endOf('day');
  const today = moment().endOf('day');

  // The loop runs until we reach 'today' or the hard stop
  const targetDate = today.isAfter(hardStopDate) ? hardStopDate : today;

  console.log(`Last commit: ${lastDate.format('YYYY-MM-DD')}`);
  console.log(`Streak remaining: ${streakRemaining}`);
  console.log(`Backfilling/Running from ${currentDate.format('YYYY-MM-DD')} to ${targetDate.format('YYYY-MM-DD')}...`);

  if (currentDate.isAfter(targetDate)) {
    console.log("Already up to date.");
    return;
  }

  let commitsMade = 0;

  while (currentDate.isSameOrBefore(targetDate)) {
    // Logic to decide if we commit on this 'currentDate'
    let shouldCommit = false;

    if (streakRemaining > 0) {
      shouldCommit = true;
      streakRemaining--;
    } else {
      // Not in a streak.
      // 1. Chance to start a new streak?
      // Let's say 1 in 20 chance (5%)
      const startStreak = random.int(1, 20) === 1;

      if (startStreak) {
        // Start a streak of 10-15 days
        streakRemaining = random.int(10, 15);
        shouldCommit = true;
        streakRemaining--; // consumes today
        console.log(`[Streak Started] ${streakRemaining} days remaining after today.`);
      } else {
        // Standard Logic: Skip every other day.
        // To be consistent, we check if the day is "active" based on some deterministic property
        // OR relative to the last commit.
        // The requirement was "keep the skip every other day logic".
        // The original script did `add(2, 'days')`.
        // That means if we committed on Jan 1, we skip Jan 2, commit Jan 3.
        // We can check if the difference in days from a reference date (Jan 1 2025) is even/odd?
        // Jan 1 (Day 0) -> Commit. Jan 2 (Day 1) -> Skip. Jan 3 (Day 2) -> Commit.
        // So if diffDays is Even, we commit.
        const diffDays = currentDate.diff(moment("2025-01-01"), 'days');
        if (diffDays % 2 === 0) {
          shouldCommit = true;
        } else {
          shouldCommit = false;
        }
      }
    }

    if (shouldCommit) {
      // How many commits? Random 1-10
      const numCommits = random.int(1, 10);

      // Generate commits
      for (let i = 0; i < numCommits; i++) {
        const hour = random.int(0, 23);
        const minute = random.int(0, 59);
        const second = random.int(0, 59);

        const commitDate = currentDate.clone().set({
          hour: hour,
          minute: minute,
          second: second
        });

        const formattedDate = commitDate.format();

        // Update state
        data = {
          date: formattedDate,
          streak: streakRemaining
        };

        console.log(`Committing: ${formattedDate} (Streak: ${streakRemaining})`);

        await jsonfile.writeFile(path, data);
        await git.add([path]);
        await git.commit(formattedDate, { "--date": formattedDate });
        commitsMade++;
      }
    } else {
      console.log(`Skipping: ${currentDate.format('YYYY-MM-DD')}`);
    }

    // Move to next day
    currentDate.add(1, 'days');
  }

  if (commitsMade > 0) {
    console.log(`Pushing ${commitsMade} commits...`);
    await git.push();
  } else {
    console.log("No new commits generated.");
  }

  console.log("Done!");
};

makeCommits();

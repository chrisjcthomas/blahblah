import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

const path = "./data.json";
const git = simpleGit();

const makeCommits = async () => {
  const startDate = moment("2025-01-01");
  const endDate = moment("2026-12-31");

  let currentDate = startDate.clone();

  console.log("Starting commit generation...");

  while (currentDate.isSameOrBefore(endDate)) {
    // We want 10 commits on this day
    for (let i = 0; i < 10; i++) {
      // Generate a random time for this specific day
      const hour = random.int(0, 23);
      const minute = random.int(0, 59);
      const second = random.int(0, 59);

      const commitDate = currentDate.clone().set({
        hour: hour,
        minute: minute,
        second: second
      });

      const formattedDate = commitDate.format();

      const data = {
        date: formattedDate,
      };

      console.log(`Committing: ${formattedDate}`);

      await jsonfile.writeFile(path, data);
      await git.add([path]);
      await git.commit(formattedDate, { "--date": formattedDate });
    }

    // Move to the next active day (every other day)
    currentDate.add(2, 'days');
  }

  console.log("Pushing all commits...");
  await git.push();
  console.log("Done!");
};

makeCommits();

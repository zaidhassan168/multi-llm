import simpleGit, { SimpleGit } from 'simple-git';

import fs from 'fs';
const git: SimpleGit = simpleGit();

export const cloneRepository = async (repoUrl: string, localDir: string) => {
  await git.clone(repoUrl, localDir);
};

export const getFiles = async (localDir: string) => {
  return git.cwd(localDir).status();
};

export const readFile = async (filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8');
};

export const commitChanges = async (message: string) => {
  await git.add('.');
  await git.commit(message);
  await git.push();
};

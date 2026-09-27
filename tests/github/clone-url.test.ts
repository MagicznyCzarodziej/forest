import { describe, expect, it } from 'vitest';
import { buildCloneUrl, withGitHubCredentials } from '../../src/github/clone-url';

describe('buildCloneUrl', () => {
  it('uses https so gh can authenticate private repositories', () => {
    expect(buildCloneUrl({ kind: 'user', login: 'octocat' }, 'hello')).toBe(
      'https://github.com/octocat/hello.git',
    );
    expect(buildCloneUrl({ kind: 'organization', login: 'acme' }, 'app')).toBe(
      'https://github.com/acme/app.git',
    );
  });

  it('uses ssh when that is the gh git protocol', () => {
    expect(buildCloneUrl({ kind: 'user', login: 'octocat' }, 'hello', 'ssh')).toBe(
      'git@github.com:octocat/hello.git',
    );
  });
});

describe('withGitHubCredentials', () => {
  it('asks git to use the gh token for github https remotes', () => {
    expect(withGitHubCredentials('https://github.com/octocat/hello.git', ['clone'])).toEqual([
      '-c',
      'credential.https://github.com.helper=',
      '-c',
      'credential.https://github.com.helper=!gh auth git-credential',
      'clone',
    ]);
  });

  it('leaves ssh remotes unchanged', () => {
    expect(withGitHubCredentials('git@github.com:octocat/hello.git', ['clone'])).toEqual(['clone']);
  });
});

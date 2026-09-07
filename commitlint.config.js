// Conventional Commits linting — see https://www.conventionalcommits.org
// Enforced loosely: the commit-msg hook only warns, it never blocks (see .husky/commit-msg).
export default {
    extends: ['@commitlint/config-conventional'],
}

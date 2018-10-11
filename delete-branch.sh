git branch --delete $1
git push origin :$1
git branch --all
git status

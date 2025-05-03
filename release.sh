#!/bin/bash
if [ "$ENV" = "dev" ]; then
    BUCKET_SUFFIX="dev"
else
    BUCKET_SUFFIX="prod"
fi
s3=false;
for flag in "$@"
do
    case "${flag}" in
        "s") s3=true;;
    esac
done
if $s3; then
    echo "S3 selected";
fi
if ! $s3; then
    echo "You can supply s, but you supplied nothing, so I will do nothing";
fi

if $s3; then
    aws s3 sync s3 s3://escargo-${BUCKET_SUFFIX}-bucket --exclude "*env.js" --exclude "*.DS_Store" --delete
fi
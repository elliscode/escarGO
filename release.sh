#!/bin/bash
if [ "$ENV" = "dev" ]; then
    BUCKET_SUFFIX="dev"
    FUNCTION_SUFFIX="dev"
else
    BUCKET_SUFFIX="prod"
    FUNCTION_SUFFIX="prod"
fi
lambda=false;
s3=false;
for flag in "$@"
do
    case "${flag}" in
        "l") lambda=true;;
        "s") s3=true;;
        "ls") s3=true;lambda=true;;
        "sl") s3=true;lambda=true;;
    esac
done
if $lambda; then
    echo "Lambda selected";
fi
if $s3; then
    echo "S3 selected";
fi
if ! $lambda && ! $s3; then
    echo "You can supply either l or s, or ls, you supplied nothing, so I will do nothing";
    echo "";
    echo "./${ENV}-release.sh ls";
fi

if $lambda; then
    cd lambda/
    TIMESTAMP=$(date +%s)
    zip -vr ../lambda-release-${ENV}-${TIMESTAMP}.zip . -x "*.DS_Store"
    cd ../
    aws lambda update-function-code --function-name=escarGOlambda-${FUNCTION_SUFFIX} --zip-file=fileb://lambda-release-${ENV}-${TIMESTAMP}.zip --no-cli-pager
fi

if $s3; then
    aws s3 sync s3 s3://escargo-${BUCKET_SUFFIX}-bucket --exclude "*env.js" --exclude "*.DS_Store" --delete
fi
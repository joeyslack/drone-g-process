echo "============"
echo "Pull bucket data and process data..."
echo "------------"
sleep 5
# Get data
# azcopy issue... / rsync
echo "Get data from bucket -> Place data into processing container..."
sleep 5
cp -R ../20200226T012552-0500 ./process_current
echo "------------"
echo "Run json -> migration..."
sleep 5
echo "-------------"
echo "generate migrations"
sleep 5
npm run process:json
sleep 5
echo "-------------"
echo "copy migrations"
cp -R migrations ../gather-api
sleep 5
echo "------------"
echo "All done with 0 errors"
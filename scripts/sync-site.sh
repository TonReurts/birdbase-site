#!/bin/bash

# Sync pictures between source and target directories
# - Moves new files from source to target
# - Deletes files in target that don't exist in source
# - Overwrites files in target if size has changed

source_dir="/Volumes/Foto's/Capture One/site export"
site_base="/Volumes/Documenten/GitRepositories/birdbase-site"
target_dir="$site_base/pictures"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if directories exist
if [ ! -d "$source_dir" ]; then
    echo -e "${RED}Error: Source directory does not exist: $source_dir${NC}"
    exit 1
fi

if [ ! -d "$target_dir" ]; then
    echo -e "${RED}Error: Target directory does not exist: $target_dir${NC}"
    exit 1
fi

echo "Starting sync..."
echo "Source: $source_dir"
echo "Target: $target_dir"
echo ""

# Process files in source
echo -e "${YELLOW}Processing files in source directory...${NC}"
for source_file in "$source_dir"/*; do
    if [ -f "$source_file" ]; then
        filename=$(basename "$source_file")
        target_file="$target_dir/$filename"
        
        if [ ! -f "$target_file" ]; then
            # File exists in source but not in target
            echo -e "${GREEN}Moving:${NC} $filename (new file)"
            cp "$source_file" "$target_file"
        else
            # File exists in both, check size
            source_size=$(stat -f%z "$source_file")
            target_size=$(stat -f%z "$target_file")
            
            if [ "$source_size" -ne "$target_size" ]; then
                echo -e "${GREEN}Updating:${NC} $filename (size changed: $target_size -> $source_size bytes)"
                cp "$source_file" "$target_file"
            else
                echo -e "${YELLOW}Skipping:${NC} $filename (no changes)"
            fi
        fi
    fi
done

echo ""

# Process files in target to delete files not in source
echo -e "${YELLOW}Processing files in target directory...${NC}"
for target_file in "$target_dir"/*; do
    if [ -f "$target_file" ]; then
        filename=$(basename "$target_file")
        source_file="$source_dir/$filename"
        
        if [ ! -f "$source_file" ]; then
            echo -e "${RED}Deleting:${NC} $filename (not in source)"
            rm "$target_file"
        fi
    fi
done

echo -e "${GREEN}Creating JSON data...${NC}"
./scripts/create-json.sh

echo -e "${GREEN}Syncing site to server...${NC}"
items_to_sync=(
    "data"
    "src"
    "styles"
    "pictures"
    "index.html"  # root bestand
)

for item in "${items_to_sync[@]}"; do
    echo "Syncing $item"

    if [ -d "$site_base/$item" ]; then
        # is een folder
        rsync -avz --delete -e "ssh -p 22" \
            "$site_base/$item/" \
            reurts.com@ssh.strato.com:~/htdocs/$item/
    else
        # is een bestand
        rsync -avz -e "ssh -p 22" \
            "$site_base/$item" \
            reurts.com@ssh.strato.com:~/htdocs/
    fi
done

echo ""
echo -e "${GREEN}Sync complete!${NC}"

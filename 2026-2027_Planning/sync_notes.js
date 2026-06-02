const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Resolve path to the service account credentials relative to this script
const serviceAccountPath = path.join(__dirname, '../site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json');

// Helper to slugify note titles into clean, cross-platform filenames
function slugify(text) {
    if (!text) return 'untitled';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // split accented characters into base and accent
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/\s+/g, '-') // replace spaces with dash
        .replace(/[^\w\-]+/g, '') // remove non-alphanumeric except dash
        .replace(/\-\-+/g, '-') // collapse consecutive dashes
        .replace(/^-+/, '') // trim leading dash
        .replace(/-+$/, ''); // trim trailing dash
}

async function main() {
    console.log('🔄 Starting Curriculum Planning Journal Sync...');

    // 1. Verify that the Firebase service account exists
    if (!fs.existsSync(serviceAccountPath)) {
        console.error(`❌ Error: Service account JSON file not found at: ${serviceAccountPath}`);
        console.error('Make sure you have downloaded site-6e500-firebase-adminsdk-fbsvc-407ccb8f99.json to the repository root directory.');
        process.exit(1);
    }

    // 2. Initialize Firebase Admin SDK
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✨ Firebase Admin initialized successfully.');
    } catch (err) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
        process.exit(1);
    }

    const db = admin.firestore();
    const notesDir = path.join(__dirname, 'notes');

    // 3. Ensure the destination directory exists
    if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir, { recursive: true });
        console.log(`📁 Created planning notes directory: 2026-2027_Planning/notes/`);
    }

    try {
        // 4. Fetch all notes from Cloud Firestore
        console.log('📥 Querying journal notes from Cloud Firestore...');
        const snapshot = await db.collection('notes').orderBy('updated_at', 'desc').get();
        
        if (snapshot.empty) {
            console.log('⚠️ No notes found in Cloud Firestore.');
            // Clean up any existing local files if Firestore is empty
            const existingFiles = fs.readdirSync(notesDir);
            for (const file of existingFiles) {
                if (file.endsWith('.md')) {
                    fs.unlinkSync(path.join(notesDir, file));
                    console.log(`🗑️ Removed local orphaned file: ${file}`);
                }
            }
            console.log('✅ Sync completed. Workspace folder is empty.');
            process.exit(0);
        }

        console.log(`📝 Found ${snapshot.size} notes in cloud. Formatting and writing...`);

        const syncedFilenames = new Set();
        let createdCount = 0;
        let updatedCount = 0;

        // 5. Process and write each note
        snapshot.forEach(doc => {
            const data = doc.data();
            const docId = doc.id;
            
            const title = data.title || 'Untitled Note';
            const body = data.body || '';
            const category = data.category || '💡 Idea';
            
            // Format dates
            const createdDate = data.created_at ? data.created_at.toDate() : new Date();
            const updatedDate = data.updated_at ? data.updated_at.toDate() : new Date();

            // Construct unique, human-readable filename
            const cleanSlug = slugify(title) || 'untitled';
            const filename = `${cleanSlug}_${docId.substring(0, 6)}.md`;
            const filePath = path.join(notesDir, filename);
            syncedFilenames.add(filename);

            // Construct frontmatter and markdown body
            const fileContent = `---
id: "${docId}"
title: "${title.replace(/"/g, '\\"')}"
category: "${category}"
created_at: "${createdDate.toISOString()}"
updated_at: "${updatedDate.toISOString()}"
---

# ${title}

${body}
`;

            // Check if file already exists and if it is changed
            let isNew = true;
            if (fs.existsSync(filePath)) {
                isNew = false;
                const existingContent = fs.readFileSync(filePath, 'utf8');
                if (existingContent === fileContent) {
                    // No changes, skip writing
                    return;
                }
            }

            fs.writeFileSync(filePath, fileContent, 'utf8');
            if (isNew) {
                console.log(`➕ Created: ${filename} [${category}]`);
                createdCount++;
            } else {
                console.log(`🔄 Updated: ${filename} [${category}]`);
                updatedCount++;
            }
        });

        // 6. Clean up orphaned local files (files that exist locally but were deleted in Firestore)
        const localFiles = fs.readdirSync(notesDir);
        let deletedCount = 0;

        for (const file of localFiles) {
            if (file.endsWith('.md') && !syncedFilenames.has(file)) {
                fs.unlinkSync(path.join(notesDir, file));
                console.log(`🗑️ Removed deleted note: ${file}`);
                deletedCount++;
            }
        }

        console.log('\n=============================================');
        console.log(`✅ Synchronization Complete!`);
        console.log(`   ➕ Created: ${createdCount}`);
        console.log(`   🔄 Updated: ${updatedCount}`);
        console.log(`   🗑️ Cleaned: ${deletedCount}`);
        console.log(`   📂 Total local notes in workspace: ${syncedFilenames.size}`);
        console.log('=============================================');

    } catch (err) {
        console.error('❌ Error during synchronization:', err.message);
        process.exit(1);
    }
}

main().catch(console.error);

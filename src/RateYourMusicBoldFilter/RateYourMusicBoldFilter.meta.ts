import { Metadata } from "userscript-metadata-generator";

const metadata: Metadata = {
    name: 'Rate Your Music bold filter',
    description: 'Adds a checkbox to RYM artist pages to show only bolded works',
    match: 'https://rateyourmusic.com/artist/*'
}

module.exports = metadata;
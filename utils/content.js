/**
 * Content extraction and metadata stripping utilities
 */

function stripMetadata(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\[\/?Content\]/g, '')
    .replace(/\[Discord [^\]]+\]/g, '')
    .replace(/\[message_id: [^\]]+\]/g, '')
    .replace(/\[[^\]]+ user id:[^\]]+\]/g, '')
    .trim();
}

function extractContent(content) {
  if (typeof content === 'string') return stripMetadata(content);
  if (!content) return '';
  if (Array.isArray(content)) {
    return content.map(p => (typeof p === 'string' ? stripMetadata(p) : stripMetadata(p.text || p.content || ''))).join('\n');
  }
  return stripMetadata(String(content.text || content.content || content));
}

module.exports = {
  stripMetadata,
  extractContent
};

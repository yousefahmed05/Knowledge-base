function stripHtml(html) {
    return String(html || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

function isRichHtml(value) {
    return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
}

function isEmptyHtml(html) {
    return !stripHtml(html);
}

function parseStepsFromDetails(value) {
    if (!value || !String(value).trim()) {
        return [];
    }

    const raw = String(value).trim();

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map((step, index) => ({
                number: index + 1,
                department: step.department || '',
                content: step.content || ''
            })).filter((step) => step.department || !isEmptyHtml(step.content));
        }
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.steps)) {
            return parsed.steps.map((step, index) => ({
                number: index + 1,
                department: step.department || '',
                content: step.content || ''
            })).filter((step) => step.department || !isEmptyHtml(step.content));
        }
    } catch (_err) {
        // Legacy plain-text format
    }

    return raw.split(/\n\s*\n/).filter(Boolean).map((section, index) => {
        const lines = section.split(/\r?\n/).map((line) => line.trim());
        const firstLine = lines[0] || '';
        const numberedMatch = firstLine.match(/^(\d+)\.\s*(.*)$/);
        const departmentLine = lines.find((line) => /^department:/i.test(line));
        const department = departmentLine ? departmentLine.replace(/^department:/i, '').trim() : '';
        const contentLines = lines.filter((line, lineIndex) => {
            if (lineIndex === 0 && numberedMatch) return false;
            const trimmed = line.trim();
            if (!trimmed) return false;
            if (/^department:/i.test(trimmed) || /^content:/i.test(trimmed)) return false;
            return true;
        });
        const content = contentLines.join('\n').trim();

        return {
            number: numberedMatch ? Number(numberedMatch[1]) : index + 1,
            department,
            content: content || section.trim()
        };
    }).filter((step) => step.department || step.content);
}

/** @deprecated use parseArticleDetails / getArticleBody */
function parseArticleDetails(value) {
    return parseStepsFromDetails(value);
}

function normalizeLayout(layout, hasBulk, hasSteps) {
    const allowed = ['bulk', 'steps', 'both'];
    if (allowed.includes(layout)) return layout;
    if (hasBulk && hasSteps) return 'both';
    if (hasBulk) return 'bulk';
    return 'steps';
}

function getArticleBody(service) {
    const steps = parseStepsFromDetails(service.details || service.content || '');
    const bulkContent = service.bulkContent || '';
    const hasBulk = !isEmptyHtml(bulkContent);
    const hasSteps = steps.length > 0;
    const layout = normalizeLayout(service.detailsLayout, hasBulk, hasSteps);

    return {
        layout,
        bulkContent,
        steps,
        hasBulk: layout === 'bulk' || layout === 'both' ? hasBulk : false,
        hasSteps: layout === 'steps' || layout === 'both' ? hasSteps : false
    };
}

function getArticlePlainText(service) {
    const body = getArticleBody(service);
    const stepText = body.steps
        .map((step) => [step.department, stripHtml(step.content)].filter(Boolean).join(' '))
        .join(' ');

    return [
        service.name || '',
        stripHtml(service.description || ''),
        stripHtml(body.bulkContent || ''),
        stepText
    ].join(' ').trim();
}

module.exports = {
    stripHtml,
    isRichHtml,
    isEmptyHtml,
    parseArticleDetails,
    parseStepsFromDetails,
    getArticleBody,
    getArticlePlainText
};

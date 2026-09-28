/**
 * Set on <html> while the newsletter prompt is open (`NewsletterModal`). The
 * hero's mascot waits for it to go before walking in (`CarouselGuide`): the
 * prompt opens once the page has scrolled 1200px, which on a 900px-tall window
 * is about when the carousel's dots come into view and the mascot arrives, and
 * a walk played behind the prompt's overlay is an entrance nobody sees.
 */
export const PROMPT_OPEN_ATTRIBUTE = 'data-newsletter-prompt';

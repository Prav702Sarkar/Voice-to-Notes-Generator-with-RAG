from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from io import BytesIO
from html.parser import HTMLParser
import re
from datetime import datetime
from html import unescape

class HTMLToText(HTMLParser):
    """Convert HTML to plain text while preserving structure"""
    def __init__(self):
        super().__init__()
        self.reset()
        self.text = []
        self.in_p = False
        self.in_br = False
        
    def handle_starttag(self, tag, attrs):
        if tag in ['p', 'div']:
            if self.text and self.text[-1] != '\n':
                self.text.append('\n')
        elif tag == 'br':
            self.text.append('\n')
        elif tag in ['strong', 'b']:
            pass
        elif tag in ['em', 'i']:
            pass
            
    def handle_endtag(self, tag):
        if tag in ['p', 'div', 'li']:
            if self.text and self.text[-1] != '\n':
                self.text.append('\n')
                
    def handle_data(self, data):
        text = data.strip()
        if text:
            self.text.append(text)
            
    def get_text(self):
        return ''.join(self.text)

def strip_html_preserve_structure(html_text):
    """Strip HTML tags while preserving structure"""
    if not html_text:
        return ""
    
    try:
        # Decode HTML entities
        text = unescape(html_text)
        
        # Convert br tags to newlines before parsing
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        
        # Convert p and div tags
        text = re.sub(r'</?p>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</?div>', '\n', text, flags=re.IGNORECASE)
        
        # Use HTML parser to clean remaining tags
        parser = HTMLToText()
        parser.feed(text)
        clean_text = parser.get_text()
        
        # Clean up multiple newlines
        clean_text = re.sub(r'\n\s*\n', '\n\n', clean_text)
        
        return clean_text.strip()
    except:
        return html_text

def clean_text(text):
    """Clean and format text for PDF"""
    if not text:
        return ""
    
    # Use smart HTML stripping
    text = strip_html_preserve_structure(text)
    
    # Replace multiple consecutive spaces with single space (but preserve newlines)
    lines = text.split('\n')
    lines = [re.sub(r'\s+', ' ', line).strip() for line in lines]
    
    return '\n'.join([line for line in lines if line])

class PdfService:
    """Service for generating structured PDF documents"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Section heading style
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=HexColor('#2563eb'),
            spaceAfter=12,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['BodyText'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
            leading=14
        ))
        
        # Question style
        self.styles.add(ParagraphStyle(
            name='QuestionStyle',
            parent=self.styles['BodyText'],
            fontSize=11,
            textColor=HexColor('#1e40af'),
            spaceAfter=6,
            spaceBefore=6,
            fontName='Helvetica-Bold'
        ))
        
        # Option style
        self.styles.add(ParagraphStyle(
            name='OptionStyle',
            parent=self.styles['BodyText'],
            fontSize=10,
            spaceAfter=3,
            leftIndent=20
        ))
        
        # Definition style
        self.styles.add(ParagraphStyle(
            name='DefinitionStyle',
            parent=self.styles['BodyText'],
            fontSize=10,
            spaceAfter=10,
            leading=12
        ))

        # Definition term style
        self.styles.add(ParagraphStyle(
            name='DefinitionTermStyle',
            parent=self.styles['BodyText'],
            fontSize=11,
            textColor=HexColor('#1e40af'),
            fontName='Helvetica-Bold',
            spaceAfter=3,
            spaceBefore=6
        ))

        # Definition meaning style
        self.styles.add(ParagraphStyle(
            name='DefinitionMeaningStyle',
            parent=self.styles['BodyText'],
            fontSize=10,
            leading=13,
            leftIndent=10,
            spaceAfter=8
        ))
    
    def generate_pdf(self, lecture_data):
        """Generate a complete PDF document with all lecture materials"""
        try:
            # Create PDF document in memory
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(
                pdf_buffer,
                pagesize=letter,
                rightMargin=0.75*inch,
                leftMargin=0.75*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch,
            )
            
            # Container for PDF elements
            elements = []
            
            # Add title page
            elements.extend(self._create_title_page())
            
            # Add summary section
            if lecture_data.get('summary'):
                elements.append(PageBreak())
                elements.extend(self._create_section(
                    'Lecture Summary',
                    lecture_data['summary']
                ))
            
            # Add definitions section
            if lecture_data.get('definitions'):
                elements.append(PageBreak())
                elements.extend(self._create_definitions_section(lecture_data['definitions']))
            
            # Add quiz section
            if lecture_data.get('quiz'):
                elements.append(PageBreak())
                elements.extend(self._create_quiz_section(
                    lecture_data['quiz']
                ))
            
            # Add transcript section
            if lecture_data.get('transcript'):
                elements.append(PageBreak())
                elements.extend(self._create_section(
                    'Full Lecture Transcript',
                    lecture_data['transcript']
                ))
            
            # Add flashcards section if available
            if lecture_data.get('flashcards'):
                elements.append(PageBreak())
                elements.extend(self._create_flashcard_section(
                    lecture_data['flashcards']
                ))
            
            # Build PDF
            doc.build(elements)
            
            # Get PDF data
            pdf_buffer.seek(0)
            return pdf_buffer.getvalue()
        
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            raise
    
    def _create_title_page(self):
        """Create a professional title page"""
        elements = []
        
        # Add spacing
        elements.append(Spacer(1, 1.5*inch))
        
        # Title
        title = Paragraph(
            "LectraNote",
            self.styles['CustomTitle']
        )
        elements.append(title)
        
        # Subtitle
        subtitle = Paragraph(
            "Voice-to-Notes Generator with RAG",
            self.styles['Heading2']
        )
        elements.append(subtitle)
        
        elements.append(Spacer(1, 0.5*inch))
        
        # Study Materials
        study_title = Paragraph(
            "Complete Study Materials",
            self.styles['Heading3']
        )
        elements.append(study_title)
        
        elements.append(Spacer(1, 1*inch))
        
        # Date
        date_text = Paragraph(
            f"Generated on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            self.styles['Normal']
        )
        elements.append(date_text)
        
        elements.append(Spacer(1, 0.5*inch))
        
        # Included sections
        content_list = Paragraph(
            "<b>Contents:</b><br/>"
            "• Executive Summary<br/>"
            "• Key Definitions & Concepts<br/>"
            "• Quiz Questions with Answers<br/>"
            "• Full Lecture Transcript<br/>"
            "• Study Flashcards",
            self.styles['Normal']
        )
        elements.append(content_list)
        
        return elements
    
    def _create_section(self, title, content):
        """Create a generic section with title and content"""
        elements = []
        
        # Add section title
        heading = Paragraph(title, self.styles['CustomHeading'])
        elements.append(heading)
        
        elements.append(Spacer(1, 0.15*inch))
        
        # Clean content while preserving structure
        cleaned_content = clean_text(content)
        
        # Split into logical paragraphs
        paragraphs = cleaned_content.split('\n')
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                elements.append(Spacer(1, 0.08*inch))
                continue
            
            # Handle bullet points
            if para.startswith('•') or para.startswith('-'):
                para_text = Paragraph(
                    f"<bullet>•</bullet> {para[1:].strip()}",
                    self.styles['CustomBody']
                )
            else:
                para_text = Paragraph(para, self.styles['CustomBody'])
            
            elements.append(para_text)
            elements.append(Spacer(1, 0.08*inch))
        
        return elements

    def _parse_definitions(self, content):
        """Parse definition entries from HTML/text content into (term, meaning) tuples."""
        entries = []

        if not content:
            return entries

        raw = unescape(content)

        # First pass: capture common generated format <strong>Term:</strong> Definition<br><br>
        strong_pattern = re.compile(
            r'<strong>\s*([^<:]+?)\s*:?\s*</strong>\s*(.*?)(?=(?:<br\s*/?>\s*){2,}|<strong>|$)',
            flags=re.IGNORECASE | re.DOTALL
        )

        for match in strong_pattern.finditer(raw):
            term = re.sub(r'\s+', ' ', match.group(1)).strip(' :-')
            meaning_html = match.group(2).strip()
            meaning = clean_text(meaning_html)
            if term and meaning:
                entries.append((term, meaning))

        if entries:
            return entries

        # Fallback: parse plain-text lines with "Term: Meaning"
        cleaned = clean_text(content)
        for line in cleaned.split('\n'):
            line = line.strip()
            if not line or ':' not in line:
                continue
            term, meaning = line.split(':', 1)
            term = term.strip(' -•\t')
            meaning = meaning.strip()
            if term and meaning:
                entries.append((term, meaning))

        return entries

    def _create_definitions_section(self, content):
        """Create a structured definitions section optimized for readability."""
        elements = []

        heading = Paragraph('Key Definitions & Concepts', self.styles['CustomHeading'])
        elements.append(heading)
        elements.append(Spacer(1, 0.15 * inch))

        entries = self._parse_definitions(content)

        if entries:
            for term, meaning in entries:
                term_para = Paragraph(term, self.styles['DefinitionTermStyle'])
                meaning_para = Paragraph(meaning, self.styles['DefinitionMeaningStyle'])
                elements.append(term_para)
                elements.append(meaning_para)
        else:
            # Fallback to generic section rendering if parsing yields no pairs.
            elements.extend(self._create_section('Key Definitions & Concepts', content)[2:])

        return elements
    
    def _create_quiz_section(self, quiz_content):
        """Create a formatted quiz section"""
        elements = []
        
        # Add section title
        heading = Paragraph('Quiz Questions', self.styles['CustomHeading'])
        elements.append(heading)
        elements.append(Spacer(1, 0.15*inch))
        
        if not quiz_content or not quiz_content.strip():
            no_quiz = Paragraph("No quiz questions available.", self.styles['CustomBody'])
            elements.append(no_quiz)
            return elements
        
        # Clean quiz content while preserving structure
        cleaned_content = strip_html_preserve_structure(quiz_content)
        
        # Split into lines for processing
        lines = [line.strip() for line in cleaned_content.split('\n') if line.strip()]
        
        if not lines:
            no_quiz = Paragraph("No quiz questions available.", self.styles['CustomBody'])
            elements.append(no_quiz)
            return elements
        
        # Parse questions
        current_question = None
        current_options = []
        current_answer = None
        question_num = 0
        
        for line in lines:
            # Check if this is a question number line (e.g., "1.", "2.", "1)", "2)")
            question_match = re.match(r'^(\d+[\.\)])\s*(.+)$', line)
            
            if question_match:
                # Save previous question if exists
                if current_question:
                    question_num += 1
                    elements.extend(self._format_quiz_question(
                        question_num, current_question, current_options, current_answer
                    ))
                    elements.append(Spacer(1, 0.12*inch))
                
                # Start new question
                current_question = question_match.group(2)
                current_options = []
                current_answer = None
            
            # Check if this is an option (A), B), A., etc.)
            elif re.match(r'^[A-D][\)\.]', line):
                current_options.append(line)
            
            # Check if this is the correct answer line
            elif 'correct answer' in line.lower():
                answer_match = re.search(r'[A-D]', line.upper())
                if answer_match:
                    current_answer = answer_match.group()
            
            # If we have a question and this doesn't match known patterns, could be multi-line question
            elif current_question and not current_options:
                current_question += ' ' + line
        
        # Don't forget the last question
        if current_question:
            question_num += 1
            elements.extend(self._format_quiz_question(
                question_num, current_question, current_options, current_answer
            ))
        
        return elements
    
    def _format_quiz_question(self, num, question, options, answer):
        """Format a single quiz question for PDF"""
        formatted = []
        
        # Add question number and text
        question_para = Paragraph(
            f"<b>Question {num}: {question}</b>",
            self.styles['QuestionStyle']
        )
        formatted.append(question_para)
        formatted.append(Spacer(1, 0.08*inch))
        
        # Add options
        for option in options:
            option_para = Paragraph(
                option,
                self.styles['OptionStyle']
            )
            formatted.append(option_para)
            formatted.append(Spacer(1, 0.03*inch))
        
        # Add correct answer
        if answer:
            answer_para = Paragraph(
                f"<i><b>✓ Correct Answer: {answer}</b></i>",
                self.styles['OptionStyle']
            )
            formatted.append(answer_para)
        
        return formatted
    
    def _create_flashcard_section(self, flashcards_data):
        """Create a formatted flashcards section"""
        elements = []
        
        # Add section title
        heading = Paragraph('Study Flashcards', self.styles['CustomHeading'])
        elements.append(heading)
        elements.append(Spacer(1, 0.2*inch))
        
        # Handle different flashcards data formats
        cards = []
        if isinstance(flashcards_data, list):
            cards = flashcards_data
        elif isinstance(flashcards_data, str):
            # Try to parse as JSON
            try:
                import json
                cards = json.loads(flashcards_data)
            except:
                cards = []
        
        if not cards:
            no_cards = Paragraph(
                "No flashcards available for this lecture.",
                self.styles['CustomBody']
            )
            elements.append(no_cards)
            return elements
        
        # Add each flashcard
        for idx, card in enumerate(cards, 1):
            if isinstance(card, dict):
                front = card.get('front', card.get('question', ''))
                back = card.get('back', card.get('answer', ''))
            else:
                front = str(card)
                back = ""
            
            # Add card number
            card_num = Paragraph(
                f"<b>Card {idx}</b>",
                self.styles['QuestionStyle']
            )
            elements.append(card_num)
            elements.append(Spacer(1, 0.08*inch))
            
            # Add front (question)
            front_text = clean_text(front)
            front_para = Paragraph(
                f"<b>Question:</b> {front_text}",
                self.styles['DefinitionStyle']
            )
            elements.append(front_para)
            elements.append(Spacer(1, 0.05*inch))
            
            # Add back (answer)
            if back:
                back_text = clean_text(back)
                back_para = Paragraph(
                    f"<b>Answer:</b> {back_text}",
                    self.styles['DefinitionStyle']
                )
                elements.append(back_para)
            
            elements.append(Spacer(1, 0.15*inch))
        
        return elements

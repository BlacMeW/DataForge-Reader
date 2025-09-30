# DataForge Reader - Complete User Guide

Welcome to **DataForge Reader**, a powerful tool for processing documents into structured ML datasets with advanced analytics and project management capabilities.

## 🚀 Quick Start

1. **Access the Application**
   - Open your browser and navigate to: `http://localhost:5173`
   - Make sure the backend server is running on: `http://localhost:8000`

2. **Start a Project**
   - Click "Create New Project" to organize your documents
   - Or work with individual files without a project

3. **Upload Documents**
   - Drag & drop PDF or EPUB files onto the upload area
   - Or click to browse and select files
   - Preview files before confirming upload

## 📁 Project Management

### Creating Projects
- **New Project**: Click "Create New Project" button
- **Project Name**: Enter a descriptive name for your project
- **Description**: Add optional project description
- Projects are automatically saved to browser localStorage

### Managing Files
- **Add Files**: Upload documents to specific projects
- **Remove Files**: Click the trash icon next to files
- **Switch Projects**: Select different projects from the sidebar
- **Project Overview**: View file count, creation date, and last updated time

### Project Persistence
- Projects are saved locally in your browser
- Data persists between sessions
- Export project data before clearing browser storage

## 📄 Document Upload & Processing

### Supported File Types
- **PDF Files** (.pdf) - Text extraction with OCR fallback
- **EPUB Files** (.epub) - Structured text extraction
- **Maximum Size**: 50MB per file

### Upload Process
1. **File Selection**: Drag & drop or click to select
2. **File Preview**: Review file details before upload
3. **Upload Progress**: Real-time progress indicator
4. **Processing**: Automatic text extraction and parsing
5. **Ready for Analysis**: View parsed content immediately

### File Validation
- Automatic file type detection
- Size validation (50MB limit)
- Error handling for invalid files
- Upload status indicators

## 🔍 Content Analysis & Filtering

### Content Viewer
- **Content View**: See extracted text with paragraph structure
- **Analytics View**: Toggle to view document statistics
- **Page Navigation**: Browse multi-page documents
- **Word Count**: Per-paragraph and total statistics

### Advanced Filtering
- **Text Search**: Find specific content within documents
- **Regex Search**: Advanced pattern matching (toggle regex mode)
- **Page Filter**: Filter by specific page numbers
- **Word Count Range**: Filter paragraphs by minimum/maximum word count
- **Content Type**: Filter by paragraph characteristics

### Search Features
- **Quick Search**: Real-time text filtering
- **Regular Expressions**: Complex pattern matching
- **Case Sensitive**: Toggle case sensitivity
- **Search History**: Recent searches are remembered
- **Clear Filters**: Reset all filters with one click

## 📊 Data Analytics Dashboard

### Document Statistics
- **Total Words**: Complete word count across all content
- **Total Paragraphs**: Number of text segments
- **Average Words per Paragraph**: Content density metrics
- **Page Count**: Total pages processed

### Content Insights
- **Word Distribution**: Histogram of paragraph lengths
- **Content Analysis**: Text characteristics and patterns
- **Reading Level**: Estimated complexity metrics
- **Language Detection**: Automatic language identification

### Visual Analytics
- **Charts & Graphs**: Interactive data visualizations
- **Export Charts**: Save analytics as images
- **Filtering Impact**: See how filters affect statistics
- **Comparative Analysis**: Compare multiple documents

## 🏷️ Dataset Templates & Annotation

### Predefined Templates
Choose from 5 ML-ready dataset templates:

1. **Text Classification**
   - Fields: text, category, confidence
   - Use case: Sentiment analysis, topic classification
   - Example: News article categorization

2. **Named Entity Recognition (NER)**
   - Fields: text, entities, entity_types
   - Use case: Information extraction
   - Example: Person, location, organization detection

3. **Question Answering**
   - Fields: context, question, answer, start_pos
   - Use case: Reading comprehension, chatbots
   - Example: FAQ systems, document Q&A

4. **Text Summarization**
   - Fields: original_text, summary, compression_ratio
   - Use case: Content summarization, abstract generation
   - Example: Article summarization, document briefing

5. **Sentiment Analysis**
   - Fields: text, sentiment, confidence, aspects
   - Use case: Opinion mining, review analysis
   - Example: Product reviews, social media analysis

### Custom Templates
- **Create Custom**: Design your own dataset structure
- **Field Types**: Text, number, boolean, array options
- **Validation Rules**: Set required fields and constraints
- **Template Saving**: Reuse custom templates across projects

### Annotation Workflow
1. **Select Template**: Choose predefined or create custom
2. **Review Content**: Use filtering to focus on relevant text
3. **Annotate Data**: Add labels, categories, or metadata
4. **Auto-save**: Annotations saved automatically
5. **Quality Check**: Review and validate annotations

## 📤 Export & Dataset Creation

### Export Formats
- **CSV**: Comma-separated values for spreadsheet tools
- **JSONL**: JSON Lines format for ML frameworks
- **Custom Format**: Configure field mapping and structure

### Export Options
- **Full Dataset**: Export all annotated content
- **Filtered Dataset**: Export only filtered/selected content
- **Metadata Inclusion**: Include file info, timestamps, etc.
- **Batch Export**: Export multiple projects at once

### Dataset Quality
- **Validation**: Automatic data quality checks
- **Completeness**: Ensure all required fields are filled
- **Consistency**: Check for annotation consistency
- **Statistics**: Export includes dataset statistics

## ⌨️ Keyboard Shortcuts

### Navigation
- `Ctrl/Cmd + N`: Create new project
- `Ctrl/Cmd + O`: Open file upload
- `Ctrl/Cmd + S`: Save current work
- `Ctrl/Cmd + E`: Export dataset

### Content Operations
- `Ctrl/Cmd + F`: Open search
- `Ctrl/Cmd + G`: Find next
- `Shift + Ctrl/Cmd + G`: Find previous
- `Ctrl/Cmd + R`: Toggle regex search
- `Escape`: Clear search/close modals

### View Controls
- `Ctrl/Cmd + 1`: Content view
- `Ctrl/Cmd + 2`: Analytics view
- `Ctrl/Cmd + +`: Zoom in
- `Ctrl/Cmd + -`: Zoom out
- `Ctrl/Cmd + 0`: Reset zoom

## 🔧 Advanced Features

### File Preview System
- **Preview Modal**: See file details before upload
- **Metadata Display**: File size, type, creation date
- **Quick Actions**: Upload, cancel, or replace files
- **Drag & Drop**: Enhanced drag and drop experience

### Progress Indicators
- **Upload Progress**: Real-time upload status
- **Processing Status**: Document parsing progress
- **Export Progress**: Dataset creation progress
- **Background Tasks**: Non-blocking operations

### Auto-save & Recovery
- **Automatic Saving**: Work saved continuously
- **Session Recovery**: Restore work after browser restart
- **Version History**: Track changes over time
- **Backup Creation**: Automatic backup of important data

### Performance Optimization
- **Lazy Loading**: Load content as needed
- **Caching**: Intelligent content caching
- **Background Processing**: Non-blocking operations
- **Memory Management**: Efficient resource usage

## 🛠️ Configuration & Settings

### Application Settings
- **Theme**: Light/dark mode toggle
- **Language**: Interface language selection
- **Auto-save Interval**: Configure save frequency
- **Performance Mode**: Optimize for speed or quality

### Export Settings
- **Default Format**: Set preferred export format
- **Field Mapping**: Customize field names
- **Batch Size**: Configure export batch size
- **Compression**: Enable file compression

### Privacy & Security
- **Local Storage**: All data stored locally
- **No Cloud Upload**: Files never leave your machine
- **Secure Processing**: Client-side text processing
- **Data Cleanup**: Clear data when needed

## 🚨 Troubleshooting

### Common Issues

#### Upload Problems
- **File Too Large**: Maximum 50MB per file
- **Unsupported Format**: Only PDF and EPUB supported
- **Upload Failed**: Check network connection and server status

#### Processing Issues
- **OCR Not Working**: Check if Tesseract is installed
- **Text Extraction Failed**: Try different PDF viewer settings
- **Slow Processing**: Large files may take time

#### Template Issues
- **Templates Not Loading**: Verify backend server is running
- **Custom Template Error**: Check field validation rules
- **Annotation Not Saving**: Ensure required fields are filled

### Performance Tips
- **File Size**: Smaller files process faster
- **Browser Memory**: Close unused tabs
- **Clear Cache**: Refresh browser cache if needed
- **Server Resources**: Monitor server performance

### Getting Help
- **Error Messages**: Check browser console for details
- **Log Files**: Backend logs available in terminal
- **Documentation**: Reference this guide for solutions
- **Support**: Create issues on project repository

## 🔄 Workflow Examples

### Example 1: News Article Classification
1. Create project "News Classification"
2. Upload news articles (PDF format)
3. Select "Text Classification" template
4. Filter by content length (>100 words)
5. Annotate articles with categories
6. Export as CSV for ML training

### Example 2: Legal Document Analysis
1. Create project "Legal NER"
2. Upload legal documents
3. Use "Named Entity Recognition" template
4. Search for specific legal terms
5. Annotate entities (parties, dates, amounts)
6. Export as JSONL for NLP processing

### Example 3: Research Paper Summarization
1. Create project "Paper Summaries"
2. Upload academic papers
3. Select "Text Summarization" template
4. Filter by section (abstracts, conclusions)
5. Create summaries for each section
6. Export with compression ratios

## 📋 Best Practices

### Project Organization
- Use descriptive project names
- Group related documents together
- Regular backups of important projects
- Clean up unused projects periodically

### Data Quality
- Review extracted text for accuracy
- Use consistent annotation guidelines
- Validate data before export
- Test with small datasets first

### Performance
- Process files in batches
- Monitor memory usage
- Clear filters when not needed
- Use appropriate file sizes

### Security
- Keep sensitive data local
- Regular browser cache cleanup
- Use secure file sources
- Monitor server access logs

## 🆕 Recent Updates

### Version Features
- ✅ Enhanced drag & drop file upload
- ✅ Real-time progress indicators
- ✅ Advanced filtering and search
- ✅ Data analytics dashboard
- ✅ Project management system
- ✅ File preview functionality
- ✅ Auto-save annotations
- ✅ Keyboard shortcuts support

### Coming Soon
- 🔄 Collaborative features
- 🔄 More export formats
- 🔄 Advanced OCR options
- 🔄 Plugin system
- 🔄 API integrations

---

## 📞 Support & Resources

- **GitHub Repository**: [DataForge-Reader](https://github.com/BlacMeW/DataForge-Reader)
- **API Documentation**: http://localhost:8000/docs
- **Issue Tracker**: Report bugs and feature requests
- **Community**: Join discussions and share tips

---

*DataForge Reader - Transform your documents into ML-ready datasets with ease!*

**Version**: 1.0.0  
**Last Updated**: September 30, 2025  
**Built with**: React, TypeScript, FastAPI, Python
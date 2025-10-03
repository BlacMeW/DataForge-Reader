/**
 * Data Mining API Service
 * 
 * Provides typed API functions for NLP text analysis features including:
 * - Named Entity Recognition (NER)
 * - Keyword Extraction
 * - Sentiment Analysis
 * - Text Statistics
 */

import axios, { AxiosError } from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// ============================================================================
// Type Definitions
// ============================================================================

export interface Entity {
  text: string
  label: string
  start: number
  end: number
  confidence: number
}

export interface Keyword {
  keyword: string
  score: number
  type: string
}

export interface Sentiment {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  confidence: number
  positive_indicators: number
  negative_indicators: number
}

export interface Statistics {
  numbers: number[]
  percentages: string[]
  currencies: string[]
  measurements: string[]
}

export interface Summary {
  word_count: number
  char_count: number
  sentence_count: number
  avg_word_length: number
  avg_sentence_length: number
  unique_words: number
  lexical_diversity: number
}

export interface AnalysisOptions {
  include_entities?: boolean
  include_keywords?: boolean
  include_sentiment?: boolean
  include_statistics?: boolean
  include_summary?: boolean
  top_keywords?: number
}

export interface AnalysisResult {
  text_length: number
  entities?: Entity[]
  keywords?: Keyword[]
  sentiment?: Sentiment
  statistics?: Statistics
  summary?: Summary
  language: string
}

export interface BatchAnalysisResult {
  total_texts: number
  aggregated_entities?: Entity[]
  aggregated_keywords?: Keyword[]
  aggregated_sentiment?: {
    positive_count: number
    negative_count: number
    neutral_count: number
    average_score: number
  }
  aggregated_statistics?: {
    total_words: number
    total_chars: number
    total_sentences: number
    avg_word_length: number
    avg_sentence_length: number
    total_unique_words: number
    avg_lexical_diversity: number
  }
  individual_results: AnalysisResult[]
}

export interface HealthStatus {
  status: string
  spacy_model: string
  version: string
}

export interface ApiError {
  detail: string
  error_code?: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Analyze a single text with NLP
 * 
 * @param text - The text to analyze
 * @param options - Analysis options (what features to include)
 * @returns Analysis results
 * @throws ApiError if request fails
 */
export async function analyzeSingleText(
  text: string,
  options: AnalysisOptions = {
    include_entities: true,
    include_keywords: true,
    include_sentiment: true,
    include_statistics: true,
    include_summary: true,
    top_keywords: 10
  }
): Promise<AnalysisResult> {
  try {
    const response = await axios.post<AnalysisResult>(
      `${API_BASE_URL}/mine/analyze`,
      {
        text,
        ...options
      },
      {
        timeout: 30000 // 30 second timeout
      }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>
      throw new Error(
        axiosError.response?.data?.detail || 
        'Failed to analyze text. Please check your connection and try again.'
      )
    }
    throw new Error('An unexpected error occurred during text analysis')
  }
}

/**
 * Analyze multiple texts with batch NLP processing
 * 
 * @param texts - Array of texts to analyze
 * @param options - Analysis options
 * @returns Aggregated batch analysis results
 * @throws ApiError if request fails
 */
export async function analyzeBatchTexts(
  texts: string[],
  options: AnalysisOptions = {
    include_entities: true,
    include_keywords: true,
    include_sentiment: true,
    include_statistics: true,
    include_summary: true,
    top_keywords: 10
  }
): Promise<BatchAnalysisResult> {
  try {
    const response = await axios.post<BatchAnalysisResult>(
      `${API_BASE_URL}/mine/batch-analyze`,
      {
        texts,
        ...options
      },
      {
        timeout: 60000 // 60 second timeout for batch
      }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>
      throw new Error(
        axiosError.response?.data?.detail || 
        'Failed to analyze texts. The batch might be too large or the server is busy.'
      )
    }
    throw new Error('An unexpected error occurred during batch analysis')
  }
}

/**
 * Check the health status of the data mining service
 * 
 * @returns Health status including spaCy model info
 * @throws ApiError if service is unavailable
 */
export async function checkMiningHealth(): Promise<HealthStatus> {
  try {
    const response = await axios.get<HealthStatus>(
      `${API_BASE_URL}/mine/health`,
      {
        timeout: 5000 // 5 second timeout
      }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('Data mining service is unavailable. Please ensure the backend is running.')
    }
    throw new Error('Failed to check service health')
  }
}

/**
 * Get entity color based on label
 * 
 * @param label - Entity label (PERSON, ORG, GPE, etc.)
 * @returns Hex color code
 */
export function getEntityColor(label: string): string {
  const colors: Record<string, string> = {
    'PERSON': '#3b82f6',      // Blue
    'ORG': '#8b5cf6',          // Purple
    'GPE': '#10b981',          // Green
    'DATE': '#f59e0b',         // Orange
    'MONEY': '#059669',        // Emerald
    'PRODUCT': '#ec4899',      // Pink
    'TIME': '#06b6d4',         // Cyan
    'PERCENT': '#ef4444',      // Red
    'CARDINAL': '#6366f1',     // Indigo
    'QUANTITY': '#14b8a6',     // Teal
    'ORDINAL': '#a855f7',      // Purple-pink
    'EVENT': '#f97316',        // Orange-red
    'WORK_OF_ART': '#ec4899',  // Pink
    'LAW': '#6366f1',          // Indigo
    'LANGUAGE': '#8b5cf6',     // Purple
    'FAC': '#10b981',          // Green
    'LOC': '#10b981',          // Green
    'NORP': '#3b82f6',         // Blue
  }
  return colors[label] || '#6b7280' // Default gray
}

/**
 * Get sentiment color based on sentiment type
 * 
 * @param sentiment - Sentiment type (positive, negative, neutral)
 * @returns Hex color code
 */
export function getSentimentColor(sentiment: string): string {
  if (sentiment === 'positive') return '#10b981' // Green
  if (sentiment === 'negative') return '#ef4444' // Red
  return '#f59e0b' // Orange (neutral)
}

/**
 * Get sentiment icon based on sentiment type
 * 
 * @param sentiment - Sentiment type
 * @returns Icon character
 */
export function getSentimentIcon(sentiment: string): string {
  if (sentiment === 'positive') return '✓'
  if (sentiment === 'negative') return '✗'
  return '~'
}

/**
 * Format entity label for display
 * 
 * @param label - Raw entity label
 * @returns Human-readable label
 */
export function formatEntityLabel(label: string): string {
  const labels: Record<string, string> = {
    'PERSON': 'Person',
    'ORG': 'Organization',
    'GPE': 'Location',
    'DATE': 'Date',
    'MONEY': 'Money',
    'PRODUCT': 'Product',
    'TIME': 'Time',
    'PERCENT': 'Percentage',
    'CARDINAL': 'Number',
    'QUANTITY': 'Quantity',
    'ORDINAL': 'Ordinal',
    'EVENT': 'Event',
    'WORK_OF_ART': 'Work of Art',
    'LAW': 'Law',
    'LANGUAGE': 'Language',
    'FAC': 'Facility',
    'LOC': 'Location',
    'NORP': 'Nationality/Group',
  }
  return labels[label] || label
}

/**
 * Highlight entities in text
 * 
 * @param text - Original text
 * @param entities - List of entities
 * @returns Text with entity markers (for HTML rendering)
 */
export function highlightEntities(text: string, entities: Entity[]): string {
  if (!entities || entities.length === 0) return text

  // Sort entities by start position (descending) to insert from end to start
  const sortedEntities = [...entities].sort((a, b) => b.start - a.start)

  let result = text
  for (const entity of sortedEntities) {
    const before = result.substring(0, entity.start)
    const entityText = result.substring(entity.start, entity.end)
    const after = result.substring(entity.end)
    
    const color = getEntityColor(entity.label)
    result = `${before}<span class="entity" style="background-color: ${color}20; border-bottom: 2px solid ${color}; padding: 2px 4px; border-radius: 3px;" title="${formatEntityLabel(entity.label)}: ${entityText}">${entityText}</span>${after}`
  }

  return result
}

/**
 * Calculate aggregated sentiment from multiple results
 * 
 * @param results - Array of analysis results
 * @returns Aggregated sentiment statistics
 */
export function aggregateSentiment(results: AnalysisResult[]): {
  positive_count: number
  negative_count: number
  neutral_count: number
  average_score: number
} {
  let positiveCount = 0
  let negativeCount = 0
  let neutralCount = 0
  let totalScore = 0

  for (const result of results) {
    if (result.sentiment) {
      if (result.sentiment.sentiment === 'positive') positiveCount++
      else if (result.sentiment.sentiment === 'negative') negativeCount++
      else neutralCount++
      
      totalScore += result.sentiment.score
    }
  }

  return {
    positive_count: positiveCount,
    negative_count: negativeCount,
    neutral_count: neutralCount,
    average_score: results.length > 0 ? totalScore / results.length : 0
  }
}

// Export all for convenience
export default {
  analyzeSingleText,
  analyzeBatchTexts,
  checkMiningHealth,
  getEntityColor,
  getSentimentColor,
  getSentimentIcon,
  formatEntityLabel,
  highlightEntities,
  aggregateSentiment
}

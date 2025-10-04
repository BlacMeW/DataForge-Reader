import React, { useMemo } from 'react'
import { BarChart, PieChart, TrendingUp, FileText, Hash, Clock, Eye } from 'lucide-react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, Legend } from 'recharts'
import type { ParsedParagraph } from '../App'

interface DataAnalyticsProps {
  paragraphs: ParsedParagraph[]
  filename: string
  processingInfo?: {
    totalPages: number
    extractionMethod: string
    processingTime: number
  }
}

const DataAnalytics: React.FC<DataAnalyticsProps> = ({ 
  paragraphs, 
  filename, 
  processingInfo 
}) => {
  // Calculate analytics
  const analytics = useMemo(() => {
    if (paragraphs.length === 0) return null

    // Basic stats
    const totalWords = paragraphs.reduce((sum, p) => sum + p.word_count, 0)
    const totalChars = paragraphs.reduce((sum, p) => sum + p.char_count, 0)
    const avgWordsPerParagraph = Math.round(totalWords / paragraphs.length)
    const avgCharsPerParagraph = Math.round(totalChars / paragraphs.length)

    // Page distribution
    const pageDistribution = paragraphs.reduce((acc, p) => {
      acc[p.page] = (acc[p.page] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    // Word count distribution
    const wordCountRanges = {
      'Very Short (1-10)': 0,
      'Short (11-25)': 0,
      'Medium (26-50)': 0,
      'Long (51-100)': 0,
      'Very Long (100+)': 0
    }

    paragraphs.forEach(p => {
      if (p.word_count <= 10) wordCountRanges['Very Short (1-10)']++
      else if (p.word_count <= 25) wordCountRanges['Short (11-25)']++
      else if (p.word_count <= 50) wordCountRanges['Medium (26-50)']++
      else if (p.word_count <= 100) wordCountRanges['Long (51-100)']++
      else wordCountRanges['Very Long (100+)']++
    })

    // Find longest and shortest paragraphs
    const sortedByWords = [...paragraphs].sort((a, b) => b.word_count - a.word_count)
    const longestParagraph = sortedByWords[0]
    const shortestParagraph = sortedByWords[sortedByWords.length - 1]

    return {
      totalWords,
      totalChars,
      avgWordsPerParagraph,
      avgCharsPerParagraph,
      pageDistribution,
      wordCountRanges,
      longestParagraph,
      shortestParagraph,
      totalPages: Object.keys(pageDistribution).length,
      paragraphsPerPage: Math.round(paragraphs.length / Object.keys(pageDistribution).length)
    }
    }, [paragraphs])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analytics) return { wordCountData: [], pageData: [] }

    // Word count distribution data for pie chart
    const wordCountData = Object.entries(analytics.wordCountRanges).map(([range, count]) => ({
      name: range,
      value: count as number,
      percentage: Math.round(((count as number) / paragraphs.length) * 100)
    }))

    // Page distribution data for bar chart (first 15 pages)
    const pageData = Object.entries(analytics.pageDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(0, 15)
      .map(([page, count]) => ({
        page: `Page ${page}`,
        paragraphs: count as number
      }))

    return { wordCountData, pageData }
  }, [paragraphs, analytics])

  if (!analytics) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <BarChart size={48} style={{ margin: '0 auto 10px' }} />
        <p>No data available for analytics</p>
      </div>
    )
  }

  const StatCard: React.FC<{
    icon: React.ReactNode
    title: string
    value: string | number
    subtitle?: string
    color?: string
  }> = ({ icon, title, value, subtitle, color = '#3b82f6' }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ color, marginRight: '8px' }}>{icon}</div>
        <h4 style={{ margin: 0, color: '#374151', fontSize: '14px', fontWeight: '500' }}>
          {title}
        </h4>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {subtitle}
        </div>
      )}
    </div>
  )

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={24} color="#3b82f6" />
          Document Analytics
        </h3>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          Statistical analysis of "{filename}"
        </p>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          icon={<Hash size={20} />}
          title="Total Paragraphs"
          value={paragraphs.length}
          subtitle={`${analytics.paragraphsPerPage} per page avg`}
        />
        <StatCard
          icon={<FileText size={20} />}
          title="Total Words"
          value={analytics.totalWords}
          subtitle={`${analytics.avgWordsPerParagraph} per paragraph avg`}
          color="#10b981"
        />
        <StatCard
          icon={<Eye size={20} />}
          title="Total Characters"
          value={analytics.totalChars}
          subtitle={`${analytics.avgCharsPerParagraph} per paragraph avg`}
          color="#f59e0b"
        />
        <StatCard
          icon={<BarChart size={20} />}
          title="Pages"
          value={analytics.totalPages}
          subtitle={processingInfo?.extractionMethod || 'Text extraction'}
          color="#8b5cf6"
        />
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Word Count Distribution */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#374151'
          }}>
            <PieChart size={18} />
            Paragraph Length Distribution
          </h4>
          {chartData.wordCountData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={chartData.wordCountData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.wordCountData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Paragraphs']} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              No data available
            </div>
          )}
        </div>

        {/* Page Distribution */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ 
            margin: '0 0 16px 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#374151'
          }}>
            <BarChart size={18} />
            Paragraphs per Page
          </h4>
          {chartData.pageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsBarChart data={chartData.pageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="page" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Paragraphs']}
                  labelFormatter={(label) => `Page: ${label}`}
                />
                <Bar dataKey="paragraphs" fill="#10b981" />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              No page data available
            </div>
          )}
          {Object.keys(analytics.pageDistribution).length > 15 && (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
              Showing first 15 pages of {Object.keys(analytics.pageDistribution).length} total
            </p>
          )}
        </div>
      </div>

      {/* Detailed Stats */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h4 style={{ 
          margin: '0 0 16px 0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#374151'
        }}>
          <FileText size={18} />
          Content Insights
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <h5 style={{ margin: '0 0 8px 0', color: '#059669', fontSize: '14px' }}>
              📏 Longest Paragraph
            </h5>
            <p style={{ 
              margin: '0 0 8px 0', 
              fontSize: '12px', 
              color: '#6b7280'
            }}>
              Page {analytics.longestParagraph.page} • {analytics.longestParagraph.word_count} words
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              color: '#374151',
              lineHeight: '1.4',
              maxHeight: '60px',
              overflow: 'hidden'
            }}>
              {analytics.longestParagraph.text.length > 150 
                ? analytics.longestParagraph.text.substring(0, 150) + '...'
                : analytics.longestParagraph.text
              }
            </p>
          </div>
          
          <div>
            <h5 style={{ margin: '0 0 8px 0', color: '#dc2626', fontSize: '14px' }}>
              📏 Shortest Paragraph
            </h5>
            <p style={{ 
              margin: '0 0 8px 0', 
              fontSize: '12px', 
              color: '#6b7280'
            }}>
              Page {analytics.shortestParagraph.page} • {analytics.shortestParagraph.word_count} words
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '13px', 
              color: '#374151',
              lineHeight: '1.4'
            }}>
              {analytics.shortestParagraph.text}
            </p>
          </div>
        </div>

        {processingInfo && (
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Processing time: {processingInfo.processingTime}s
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} color="#6b7280" />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Method: {processingInfo.extractionMethod}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataAnalytics
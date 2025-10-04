import React, { useMemo } from 'react'
import { BarChart, PieChart, TrendingUp, FileText, Hash, Clock, Eye, Target, Cloud, Activity } from 'lucide-react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, Legend, AreaChart, Area } from 'recharts'
import ReactWordcloud from 'react-wordcloud'
import type { ParsedParagraph } from '../App'

interface AnalyticsDashboardProps {
  paragraphs: ParsedParagraph[]
  filename: string
  processingInfo?: {
    totalPages: number
    extractionMethod: string
    processingTime: number
  }
  keywords?: Array<{ keyword: string; score: number }>
  entities?: Array<{ text: string; label: string; count: number }>
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  paragraphs,
  filename,
  processingInfo,
  keywords = [],
  entities = []
}) => {
  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1']

  // Calculate analytics
  const analytics = useMemo(() => {
    if (paragraphs.length === 0) return null

    // Basic stats
    const totalWords = paragraphs.reduce((sum, p) => sum + p.word_count, 0)
    const totalChars = paragraphs.reduce((sum, p) => sum + p.char_count, 0)
    const avgWordsPerParagraph = Math.round(totalWords / paragraphs.length)

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

    // Time series data (simulated based on page order)
    const timeSeriesData = Object.entries(pageDistribution)
      .sort(([a], [b]) => Number(a) - Number(b))
      .slice(0, 20)
      .map(([page, count], index) => ({
        page: `Page ${page}`,
        paragraphs: count,
        cumulative: Object.entries(pageDistribution)
          .sort(([a], [b]) => Number(a) - Number(b))
          .slice(0, index + 1)
          .reduce((sum, [, cnt]) => sum + cnt, 0)
      }))

    return {
      totalWords,
      totalChars,
      avgWordsPerParagraph,
      pageDistribution,
      wordCountRanges,
      timeSeriesData,
      totalPages: Object.keys(pageDistribution).length,
      paragraphsPerPage: Math.round(paragraphs.length / Object.keys(pageDistribution).length)
    }
  }, [paragraphs])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analytics) return { wordCountData: [], pageData: [], timeSeriesData: [] }

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

    return { wordCountData, pageData, timeSeriesData: analytics.timeSeriesData }
  }, [paragraphs, analytics])

  if (!analytics) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '2px dashed #e5e7eb'
      }}>
        <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Analytics Dashboard</h3>
        <p>No data available for analysis</p>
      </div>
    )
  }

  const StatCard: React.FC<{
    icon: React.ReactNode
    title: string
    value: string | number
    subtitle?: string
    color?: string
    trend?: 'up' | 'down' | 'neutral'
  }> = ({ icon, title, value, subtitle, color = '#3b82f6', trend }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</div>
        {trend && (
          <div style={{
            fontSize: '12px',
            color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280',
            fontWeight: '500'
          }}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '28px',
          color: '#111827'
        }}>
          <Activity size={32} color="#3b82f6" />
          Analytics Dashboard
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
          Comprehensive analysis of "{filename}"
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <StatCard
          icon={<Hash size={24} />}
          title="Total Paragraphs"
          value={paragraphs.length}
          subtitle={`${analytics.paragraphsPerPage} per page avg`}
          trend="neutral"
        />
        <StatCard
          icon={<FileText size={24} />}
          title="Total Words"
          value={analytics.totalWords}
          subtitle={`${analytics.avgWordsPerParagraph} per paragraph avg`}
          color="#10b981"
          trend="up"
        />
        <StatCard
          icon={<Eye size={24} />}
          title="Total Characters"
          value={analytics.totalChars}
          subtitle="Content volume"
          color="#f59e0b"
          trend="neutral"
        />
        <StatCard
          icon={<BarChart size={24} />}
          title="Pages"
          value={analytics.totalPages}
          subtitle={processingInfo?.extractionMethod || 'Text extraction'}
          color="#8b5cf6"
          trend="neutral"
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Word Distribution Pie Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#111827',
            fontSize: '18px'
          }}>
            <PieChart size={20} />
            Paragraph Length Distribution
          </h3>
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
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
              No data available
            </div>
          )}
        </div>

        {/* Page Distribution Bar Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#111827',
            fontSize: '18px'
          }}>
            <BarChart size={20} />
            Paragraphs per Page
          </h3>
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
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
              No page data available
            </div>
          )}
        </div>

        {/* Time Series Chart */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#111827',
            fontSize: '18px'
          }}>
            <TrendingUp size={20} />
            Content Flow
          </h3>
          {chartData.timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.timeSeriesData}>
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
                  formatter={(value: number, name: string) => [value, name === 'cumulative' ? 'Total Paragraphs' : 'Paragraphs']}
                  labelFormatter={(label) => `Page: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="paragraphs"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
              No time series data available
            </div>
          )}
        </div>

        {/* Keywords Word Cloud */}
        {(keywords.length > 0 || entities.length > 0) && (
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#111827',
              fontSize: '18px'
            }}>
              <Cloud size={20} />
              Content Insights
            </h3>
            {keywords.length > 0 ? (
              <div style={{ height: '250px', width: '100%', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>Keywords</h4>
                <ReactWordcloud
                  words={keywords.slice(0, 30).map(kw => ({
                    text: kw.keyword,
                    value: Math.max(kw.score * 100, 10)
                  }))}
                  options={{
                    rotations: 1,
                    rotationAngles: [0, 0],
                    fontSizes: [12, 36],
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: '500',
                    padding: 2,
                    scale: 'sqrt',
                    spiral: 'archimedean',
                    transitionDuration: 800,
                    colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'],
                    enableTooltip: true,
                    deterministic: false,
                    enableOptimizations: true
                  }}
                />
              </div>
            ) : null}
            {entities.length > 0 ? (
              <div style={{ height: '200px', width: '100%' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>Entities</h4>
                <ReactWordcloud
                  words={entities.slice(0, 25).map(entity => ({
                    text: entity.text,
                    value: Math.max(entity.count * 15, 8)
                  }))}
                  options={{
                    rotations: 1,
                    rotationAngles: [0, 0],
                    fontSizes: [10, 28],
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: '500',
                    padding: 2,
                    scale: 'sqrt',
                    spiral: 'archimedean',
                    transitionDuration: 800,
                    colors: ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669'],
                    enableTooltip: true,
                    deterministic: false,
                    enableOptimizations: true
                  }}
                />
              </div>
            ) : null}
            {keywords.length === 0 && entities.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>
                No NLP data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing Info */}
      {processingInfo && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '24px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#111827',
            fontSize: '18px'
          }}>
            <Clock size={20} />
            Processing Summary
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#6b7280" />
              <div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  Processing Time
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {processingInfo.processingTime}s
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="#6b7280" />
              <div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  Extraction Method
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {processingInfo.extractionMethod}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} color="#6b7280" />
              <div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  Total Pages
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {processingInfo.totalPages}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard
/**
 * Conversational Workspace
 * 
 * A split-screen interface where:
 * - Mobile: Top half = Dynamic UI, Bottom half = Chat
 * - Desktop: Left half = Dynamic UI, Right half = Chat
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';

interface UIComponent {
  type: 'text' | 'dropdown' | 'date_picker' | 'number_input' | 'button_group' | 'file_upload';
  label: string;
  paramName: string;
  options?: Array<{ label: string; value: any }>;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    pattern?: string;
  };
}

interface OutputFormat {
  id: string;
  label: string;
  description: string;
  icon: string;
  format: 'table' | 'cards' | 'chart' | 'list' | 'timeline' | 'kanban' | 'calendar' | 'map';
  recommended?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  uiComponents?: UIComponent[];
  outputFormats?: OutputFormat[];
  data?: any;
}

export function ConversationalWorkspace() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentStateId, setCurrentStateId] = useState<string | undefined>();
  const [dynamicFormData, setDynamicFormData] = useState<Record<string, any>>({});
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [displayData, setDisplayData] = useState<any>(null);

  // Mutations
  const sendMessage = trpc.cui.processMessage.useMutation({
    onSuccess: (response) => {
      // Add assistant response
      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        uiComponents: response.uiComponents,
        outputFormats: response.outputFormats,
        data: response.data
      };

      // If output formats are provided, show them
      if (response.outputFormats && response.data) {
        setDisplayData(response.data);
        // Auto-select recommended format
        const recommended = response.outputFormats.find(f => f.recommended);
        if (recommended) {
          setSelectedFormat(recommended.id);
        }
      }
      setMessages(prev => [...prev, assistantMessage]);

      if (response.completed) {
        setCurrentStateId(undefined);
        setDynamicFormData({});
      }
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to backend
    sendMessage.mutate({
      message: inputValue,
      stateId: currentStateId
    });

    setInputValue('');
  };

  const handleFormSubmit = (paramName: string, value: any) => {
    setDynamicFormData(prev => ({ ...prev, [paramName]: value }));

    // Send the value as a message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: `${paramName}: ${value}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    sendMessage.mutate({
      message: value.toString(),
      stateId: currentStateId
    });
  };

  // Get the latest UI components and output formats from the last assistant message
  const latestMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  const latestUIComponents = latestMessage?.uiComponents || [];
  const latestOutputFormats = latestMessage?.outputFormats || [];

  const handleFormatChange = (formatId: string) => {
    setSelectedFormat(formatId);
  };

  return (
    <div className="conversational-workspace">
      {/* Mobile: Vertical Split, Desktop: Horizontal Split */}
      <div className="workspace-container">
        
        {/* Dynamic UI Panel */}
        <div className="dynamic-ui-panel">
          <div className="panel-header">
            <h2>شاشة العمل</h2>
          </div>
          <div className="panel-content">
            {/* Show output format selector if available */}
            {latestOutputFormats.length > 0 && displayData && (
              <div className="format-selector-container">
                <h3 className="format-selector-title">اختر طريقة العرض:</h3>
                <div className="format-options">
                  {latestOutputFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => handleFormatChange(format.id)}
                      className={`format-option ${
                        selectedFormat === format.id ? 'selected' : ''
                      } ${format.recommended ? 'recommended' : ''}`}
                    >
                      <span className="format-icon">{format.icon}</span>
                      <div className="format-info">
                        <span className="format-label">{format.label}</span>
                        {format.recommended && (
                          <span className="recommended-badge">مُوصى به</span>
                        )}
                        <span className="format-description">{format.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="data-display">
                  <DataRenderer
                    data={displayData}
                    format={latestOutputFormats.find(f => f.id === selectedFormat)?.format || 'table'}
                  />
                </div>
              </div>
            )}

            {/* Show dynamic form if available */}
            {latestUIComponents.length > 0 && (
              <DynamicForm
                components={latestUIComponents}
                formData={dynamicFormData}
                onSubmit={handleFormSubmit}
              />
            )}

            {/* Show empty state */}
            {latestUIComponents.length === 0 && latestOutputFormats.length === 0 && (
              <div className="empty-state">
                <p>ابدأ المحادثة لإنشاء شاشة العمل</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          <div className="panel-header">
            <h2>المحادثة</h2>
          </div>
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString('ar-EG')}
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="اكتب أمرك هنا..."
              className="input-field"
            />
            <button onClick={handleSendMessage} className="send-button">
              إرسال
            </button>
          </div>
        </div>

      </div>

      <style jsx>{`
        .conversational-workspace {
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .workspace-container {
          display: flex;
          height: 100%;
        }

        /* Mobile: Vertical Split (Top/Bottom) */
        @media (max-width: 768px) {
          .workspace-container {
            flex-direction: column;
          }

          .dynamic-ui-panel,
          .chat-panel {
            width: 100%;
            height: 50%;
          }
        }

        /* Desktop: Horizontal Split (Left/Right) */
        @media (min-width: 769px) {
          .workspace-container {
            flex-direction: row;
          }

          .dynamic-ui-panel {
            width: 50%;
            border-left: 2px solid #e5e7eb;
          }

          .chat-panel {
            width: 50%;
          }
        }

        .dynamic-ui-panel,
        .chat-panel {
          display: flex;
          flex-direction: column;
          background: white;
        }

        .panel-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6b7280;
          text-align: center;
        }

        .format-selector-container {
          margin-bottom: 2rem;
        }

        .format-selector-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .format-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .format-option {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: right;
        }

        .format-option:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
        }

        .format-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .format-option.recommended {
          border-color: #10b981;
        }

        .format-option.recommended.selected {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .format-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .format-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .format-label {
          font-weight: 600;
          color: #111827;
          font-size: 0.9375rem;
        }

        .format-description {
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .recommended-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          background: #d1fae5;
          color: #065f46;
          border-radius: 0.25rem;
          font-size: 0.6875rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .data-display {
          background: #f9fafb;
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .message {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-user {
          align-self: flex-start;
          background: #3b82f6;
          color: white;
        }

        .message-assistant {
          align-self: flex-end;
          background: #f3f4f6;
          color: #111827;
        }

        .message-content {
          margin-bottom: 0.25rem;
        }

        .message-timestamp {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .chat-input {
          display: flex;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .input-field {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .send-button {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover {
          background: #2563eb;
        }

        .send-button:active {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}

/**
 * Dynamic Form Component
 * Renders UI components dynamically based on the schema
 */
interface DynamicFormProps {
  components: UIComponent[];
  formData: Record<string, any>;
  onSubmit: (paramName: string, value: any) => void;
}

function DynamicForm({ components, formData, onSubmit }: DynamicFormProps) {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  const handleChange = (paramName: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [paramName]: value }));
  };

  const handleSubmit = (paramName: string) => {
    const value = localValues[paramName];
    if (value !== undefined) {
      onSubmit(paramName, value);
      setLocalValues(prev => {
        const newValues = { ...prev };
        delete newValues[paramName];
        return newValues;
      });
    }
  };

  return (
    <div className="dynamic-form">
      {components.map((component, index) => (
        <div key={index} className="form-field">
          <label className="field-label">{component.label}</label>
          
          {component.type === 'text' && (
            <div className="field-input-group">
              <input
                type="text"
                value={localValues[component.paramName] || ''}
                onChange={(e) => handleChange(component.paramName, e.target.value)}
                placeholder={component.placeholder}
                className="field-input"
              />
              <button
                onClick={() => handleSubmit(component.paramName)}
                className="field-submit-btn"
              >
                تأكيد
              </button>
            </div>
          )}

          {component.type === 'number_input' && (
            <div className="field-input-group">
              <input
                type="number"
                value={localValues[component.paramName] || ''}
                onChange={(e) => handleChange(component.paramName, parseInt(e.target.value))}
                placeholder={component.placeholder}
                min={component.validation?.min}
                max={component.validation?.max}
                className="field-input"
              />
              <button
                onClick={() => handleSubmit(component.paramName)}
                className="field-submit-btn"
              >
                تأكيد
              </button>
            </div>
          )}

          {component.type === 'dropdown' && (
            <div className="field-input-group">
              <select
                value={localValues[component.paramName] || ''}
                onChange={(e) => handleChange(component.paramName, e.target.value)}
                className="field-select"
              >
                <option value="">اختر...</option>
                {component.options?.map((option, i) => (
                  <option key={i} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleSubmit(component.paramName)}
                className="field-submit-btn"
              >
                تأكيد
              </button>
            </div>
          )}

          {component.type === 'date_picker' && (
            <div className="field-input-group">
              <input
                type="date"
                value={localValues[component.paramName] || ''}
                onChange={(e) => handleChange(component.paramName, e.target.value)}
                className="field-input"
              />
              <button
                onClick={() => handleSubmit(component.paramName)}
                className="field-submit-btn"
              >
                تأكيد
              </button>
            </div>
          )}

          {component.type === 'button_group' && (
            <div className="button-group">
              {component.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => onSubmit(component.paramName, option.value)}
                  className="group-button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .dynamic-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-label {
          font-weight: 500;
          color: #374151;
          font-size: 0.875rem;
        }

        .field-input-group {
          display: flex;
          gap: 0.5rem;
        }

        .field-input,
        .field-select {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .field-submit-btn {
          padding: 0.75rem 1.25rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .field-submit-btn:hover {
          background: #059669;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .group-button {
          padding: 0.75rem 1.5rem;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .group-button:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .group-button:active {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}

/**
 * Data Renderer Component
 * Renders data in different formats (table, cards, chart, etc.)
 */
interface DataRendererProps {
  data: any;
  format: 'table' | 'cards' | 'chart' | 'list' | 'timeline' | 'kanban' | 'calendar' | 'map';
}

function DataRenderer({ data, format }: DataRendererProps) {
  // This is a simplified version. In production, you'd have more sophisticated renderers.
  
  if (format === 'table') {
    return <TableView data={data} />;
  }
  
  if (format === 'cards') {
    return <CardsView data={data} />;
  }
  
  if (format === 'chart') {
    return <ChartView data={data} />;
  }
  
  if (format === 'list') {
    return <ListView data={data} />;
  }
  
  if (format === 'timeline') {
    return <TimelineView data={data} />;
  }
  
  return <div>عرض غير مدعوم</div>;
}

// Table View
function TableView({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return <div className="no-data">لا توجد بيانات</div>;
  }

  const entries = Object.entries(data);

  return (
    <div className="table-view">
      <table>
        <tbody>
          {entries.map(([key, value], index) => (
            <tr key={index}>
              <th>{key}</th>
              <td>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .table-view {
          width: 100%;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        th, td {
          padding: 0.75rem 1rem;
          text-align: right;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          width: 40%;
        }
        td {
          color: #111827;
        }
        tr:last-child th,
        tr:last-child td {
          border-bottom: none;
        }
        .no-data {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

// Cards View
function CardsView({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return <div className="no-data">لا توجد بيانات</div>;
  }

  const entries = Object.entries(data);

  return (
    <div className="cards-view">
      <div className="card">
        {entries.map(([key, value], index) => (
          <div key={index} className="card-row">
            <span className="card-label">{key}</span>
            <span className="card-value">{String(value)}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .cards-view {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .card-row:last-child {
          border-bottom: none;
        }
        .card-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 0.875rem;
        }
        .card-value {
          font-weight: 600;
          color: #111827;
          font-size: 1rem;
        }
        .no-data {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

// Chart View (Placeholder)
function ChartView({ data }: { data: any }) {
  return (
    <div className="chart-view">
      <div className="chart-placeholder">
        <div className="chart-icon">📊</div>
        <p>عرض الرسم البياني</p>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
      <style jsx>{`
        .chart-view {
          width: 100%;
        }
        .chart-placeholder {
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 0.75rem;
          padding: 3rem 2rem;
          text-align: center;
          color: #6b7280;
        }
        .chart-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        pre {
          text-align: right;
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}

// List View
function ListView({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return <div className="no-data">لا توجد بيانات</div>;
  }

  const entries = Object.entries(data);

  return (
    <div className="list-view">
      <ul>
        {entries.map(([key, value], index) => (
          <li key={index}>
            <strong>{key}:</strong> {String(value)}
          </li>
        ))}
      </ul>
      <style jsx>{`
        .list-view {
          width: 100%;
        }
        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        li {
          padding: 1rem;
          background: white;
          border-radius: 0.5rem;
          margin-bottom: 0.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          color: #374151;
        }
        li:last-child {
          margin-bottom: 0;
        }
        strong {
          color: #111827;
          margin-left: 0.5rem;
        }
        .no-data {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

// Timeline View
function TimelineView({ data }: { data: any }) {
  if (!data || typeof data !== 'object') {
    return <div className="no-data">لا توجد بيانات</div>;
  }

  const entries = Object.entries(data);

  return (
    <div className="timeline-view">
      {entries.map(([key, value], index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <div className="timeline-title">{key}</div>
            <div className="timeline-value">{String(value)}</div>
          </div>
        </div>
      ))}
      <style jsx>{`
        .timeline-view {
          position: relative;
          padding-right: 2rem;
        }
        .timeline-view::before {
          content: '';
          position: absolute;
          right: 0.5rem;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
        }
        .timeline-item {
          position: relative;
          padding-bottom: 2rem;
        }
        .timeline-item:last-child {
          padding-bottom: 0;
        }
        .timeline-marker {
          position: absolute;
          right: 0;
          top: 0.25rem;
          width: 1rem;
          height: 1rem;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px #3b82f6;
        }
        .timeline-content {
          background: white;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-left: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .timeline-title {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }
        .timeline-value {
          color: #6b7280;
          font-size: 0.875rem;
        }
        .no-data {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}


import React, { useState } from 'react';
import { Question } from '@/hooks/useSurvey';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
}) => {
  const [otherValue, setOtherValue] = useState('');
  const [showOther, setShowOther] = useState(false);

  const handleMultipleChoiceChange = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    const maxSelections = question.config?.max_selections;
    
    if (checked) {
      // Check if we're at the selection limit
      if (maxSelections && currentValues.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onChange([...currentValues, optionValue]);
    } else {
      onChange(currentValues.filter((v: string) => v !== optionValue));
    }
  };

  const handleOtherChange = (otherText: string) => {
    setOtherValue(otherText);
    const currentValues = Array.isArray(value) ? value : [];
    
    if (otherText.trim()) {
      // Add or update the "Other" response
      const filteredValues = currentValues.filter((v: string) => !v.startsWith('Other: '));
      onChange([...filteredValues, `Other: ${otherText.trim()}`]);
    } else {
      // Remove "Other" response if text is empty
      onChange(currentValues.filter((v: string) => !v.startsWith('Other: ')));
    }
  };

  const moveRankingItem = (fromIndex: number, toIndex: number) => {
    if (!Array.isArray(value) || toIndex < 0 || toIndex >= value.length) return;
    
    const newOrder = [...value];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    onChange(newOrder);
  };

  const renderDescription = () => {
    if (!question.config?.description) return null;
    
    return (
      <p className="text-sm text-gray-600 mt-2 mb-4 leading-relaxed">
        {question.config.description}
      </p>
    );
  };

  const getSelectionLimitText = () => {
    const maxSelections = question.config?.max_selections;
    const currentSelections = Array.isArray(value) ? value.length : 0;
    
    if (!maxSelections) return null;
    
    return (
      <p className="text-sm text-gray-500 mt-2">
        Selected: {currentSelections} / {maxSelections}
      </p>
    );
  };

  const isSelectionLimitReached = () => {
    const maxSelections = question.config?.max_selections;
    const currentSelections = Array.isArray(value) ? value.length : 0;
    return maxSelections && currentSelections >= maxSelections;
  };

  switch (question.type) {
    case 'short_text':
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your response..."
            className="w-full"
          />
        </div>
      );

    case 'long_text':
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your response..."
            className="w-full min-h-[120px]"
            maxLength={question.config?.max_length}
          />
          {question.config?.max_length && (
            <p className="text-sm text-gray-500 mt-2">
              {(value || '').length} / {question.config.max_length} characters
            </p>
          )}
        </div>
      );

    case 'number':
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="Enter a number..."
            className="w-full"
          />
        </div>
      );

    case 'dropdown':
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.config?.choices?.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {choice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'multiple_choice':
      if (!question.allow_multiple) {
        // Single selection
        return (
          <div>
            <h3 className="text-lg font-medium mb-2">{question.label}</h3>
            {renderDescription()}
            <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-4">
              {question.config?.choices?.map((choice) => (
                <div key={choice} className="flex items-center space-x-3">
                  <RadioGroupItem value={choice} id={choice} />
                  <Label htmlFor={choice} className="text-base leading-relaxed cursor-pointer">
                    {choice}
                  </Label>
                </div>
              ))}
              {question.allow_other && (
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-base leading-relaxed cursor-pointer">
                    Other
                  </Label>
                </div>
              )}
            </RadioGroup>
            {question.allow_other && value === 'other' && (
              <div className="mt-4">
                <Input
                  value={otherValue}
                  onChange={(e) => {
                    setOtherValue(e.target.value);
                    onChange(`Other: ${e.target.value}`);
                  }}
                  placeholder="Please specify..."
                  className="w-full"
                />
              </div>
            )}
          </div>
        );
      } else {
        // Multiple selection
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <div>
            <h3 className="text-lg font-medium mb-2">{question.label}</h3>
            {renderDescription()}
            <div className="space-y-4">
              {question.config?.choices?.map((choice) => {
                const isChecked = currentValues.includes(choice);
                const isDisabled = !isChecked && isSelectionLimitReached();
                
                return (
                  <div key={choice} className="flex items-center space-x-3">
                    <Checkbox
                      id={choice}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => handleMultipleChoiceChange(choice, checked as boolean)}
                    />
                    <Label 
                      htmlFor={choice} 
                      className={`text-base leading-relaxed cursor-pointer ${isDisabled ? 'text-gray-400' : ''}`}
                    >
                      {choice}
                    </Label>
                  </div>
                );
              })}
              {question.allow_other && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="other-checkbox"
                      checked={showOther || currentValues.some((v: string) => v.startsWith('Other: '))}
                      disabled={!showOther && !currentValues.some((v: string) => v.startsWith('Other: ')) && isSelectionLimitReached()}
                      onCheckedChange={(checked) => {
                        setShowOther(checked as boolean);
                        if (!checked) {
                          handleOtherChange('');
                          setOtherValue('');
                        }
                      }}
                    />
                    <Label htmlFor="other-checkbox" className="text-base leading-relaxed cursor-pointer">
                      Other
                    </Label>
                  </div>
                  {(showOther || currentValues.some((v: string) => v.startsWith('Other: '))) && (
                    <Input
                      value={otherValue}
                      onChange={(e) => handleOtherChange(e.target.value)}
                      placeholder="Please specify..."
                      className="w-full ml-6"
                    />
                  )}
                </div>
              )}
            </div>
            {getSelectionLimitText()}
          </div>
        );
      }

    case 'rating':
      const min = question.config?.min || 1;
      const max = question.config?.max || 10;
      const currentValue = value ? [value] : [min];
      
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <div className="space-y-4">
            <div className="px-4">
              <Slider
                value={currentValue}
                onValueChange={(newValue) => onChange(newValue[0])}
                min={min}
                max={max}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 px-4">
              <span>{min}</span>
              <span className="font-medium text-lg text-atlas-navy">
                {currentValue[0]}
              </span>
              <span>{max}</span>
            </div>
          </div>
        </div>
      );

    case 'ranking':
      const rankingChoices = question.config?.choices || [];
      const rankedItems = Array.isArray(value) && value.length > 0 ? value : [...rankingChoices];
      
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              Drag or use arrows to reorder items (most important at top)
            </p>
            {rankedItems.map((item: string, index: number) => (
              <div
                key={item}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}.
                  </span>
                  <span className="text-base">{item}</span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveRankingItem(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => moveRankingItem(index, index + 1)}
                    disabled={index === rankedItems.length - 1}
                    className="p-1 h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div>
          <h3 className="text-lg font-medium mb-2">{question.label}</h3>
          {renderDescription()}
          <p className="text-red-500">Unsupported question type: {question.type}</p>
        </div>
      );
  }
};

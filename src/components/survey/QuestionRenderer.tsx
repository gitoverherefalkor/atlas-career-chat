
import React from 'react';
import { Question } from '@/hooks/useSurvey';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  error
}) => {
  const { type, label, required, allow_multiple, allow_other, config } = question;

  const renderShortText = () => (
    <div className="space-y-2">
      <Label htmlFor={question.id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={question.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer..."
      />
    </div>
  );

  const renderLongText = () => (
    <div className="space-y-2">
      <Label htmlFor={question.id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id={question.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your answer..."
        rows={4}
      />
    </div>
  );

  const renderNumber = () => (
    <div className="space-y-2">
      <Label htmlFor={question.id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={question.id}
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        placeholder="Enter a number..."
      />
    </div>
  );

  const renderMultipleChoice = () => {
    const choices = config.choices || [];
    
    if (allow_multiple) {
      return (
        <div className="space-y-3">
          <Label>
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(choice)}
                  onCheckedChange={(checked) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...currentValue, choice]);
                    } else {
                      onChange(currentValue.filter(v => v !== choice));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`} className="text-sm font-normal">
                  {choice}
                </Label>
              </div>
            ))}
            {allow_other && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-other`}
                  checked={Array.isArray(value) && value.some(v => !choices.includes(v))}
                  onCheckedChange={(checked) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    if (!checked) {
                      onChange(currentValue.filter(v => choices.includes(v)));
                    }
                  }}
                />
                <Input
                  placeholder="Other (please specify)"
                  value={Array.isArray(value) ? value.find(v => !choices.includes(v)) || '' : ''}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const otherValues = currentValue.filter(v => choices.includes(v));
                    if (e.target.value) {
                      onChange([...otherValues, e.target.value]);
                    } else {
                      onChange(otherValues);
                    }
                  }}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <Label>
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          <RadioGroup value={value || ''} onValueChange={onChange}>
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={choice} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-sm font-normal">
                  {choice}
                </Label>
              </div>
            ))}
            {allow_other && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="__other__" id={`${question.id}-other`} />
                <Input
                  placeholder="Other (please specify)"
                  value={value && !choices.includes(value) ? value : ''}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={() => onChange('__other__')}
                  className="flex-1"
                />
              </div>
            )}
          </RadioGroup>
        </div>
      );
    }
  };

  const renderDropdown = () => (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          {(config.choices || []).map((choice, index) => (
            <SelectItem key={index} value={choice}>
              {choice}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderRating = () => {
    const min = config.min || 1;
    const max = config.max || 10;
    const currentValue = value || min;

    return (
      <div className="space-y-4">
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{min}</span>
            <Slider
              value={[currentValue]}
              onValueChange={(values) => onChange(values[0])}
              min={min}
              max={max}
              step={1}
              className="flex-1"
            />
            <span className="text-sm text-gray-600">{max}</span>
          </div>
          <div className="text-center">
            <span className="text-lg font-semibold">{currentValue}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    const choices = config.choices || [];
    const currentRanking = Array.isArray(value) ? value : choices.slice();

    const moveItem = (fromIndex: number, toIndex: number) => {
      const newRanking = [...currentRanking];
      const [movedItem] = newRanking.splice(fromIndex, 1);
      newRanking.splice(toIndex, 0, movedItem);
      onChange(newRanking);
    };

    return (
      <div className="space-y-3">
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-sm text-gray-600">Drag items to rank them in order of importance (most important first):</p>
        <div className="space-y-2">
          {currentRanking.map((choice, index) => (
            <div key={choice} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-600 w-6">{index + 1}.</span>
              <span className="flex-1">{choice}</span>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, Math.max(0, index - 1))}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, Math.min(currentRanking.length - 1, index + 1))}
                  disabled={index === currentRanking.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    switch (type) {
      case 'short_text':
        return renderShortText();
      case 'long_text':
        return renderLongText();
      case 'number':
        return renderNumber();
      case 'multiple_choice':
        return renderMultipleChoice();
      case 'dropdown':
        return renderDropdown();
      case 'rating':
        return renderRating();
      case 'ranking':
        return renderRanking();
      default:
        return <div>Unsupported question type: {type}</div>;
    }
  };

  return (
    <div className="space-y-2">
      {renderQuestion()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

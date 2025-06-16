
import React from 'react';
import { Button } from "@/components/ui/button";
import { TrendingDown, Clock, Search, BookOpen, AlertTriangle, TrendingUp } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const JobDissatisfactionStats = () => {
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();

  const stats = [
    {
      icon: TrendingDown,
      percentage: "85%",
      description: "of global workers report disengagement at work",
      color: "text-red-500"
    },
    {
      icon: Clock,
      percentage: "66%",
      description: "of workers report having career-related regrets",
      color: "text-amber-500"
    },
    {
      icon: Search,
      percentage: "50%",
      description: "of U.S. employees are watching for or actively seeking a new job",
      color: "text-yellow-500"
    },
    {
      icon: BookOpen,
      percentage: "50%",
      description: "of all employees will require reskilling by 2025 due to technology adoption",
      color: "text-blue-500"
    },
    {
      icon: AlertTriangle,
      percentage: "54%",
      description: "of U.S. workers experience stress from job insecurity",
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      percentage: "202%",
      description: "higher performance in companies with satisfied employees vs. those with low satisfaction",
      color: "text-green-500"
    }
  ];

  return (
    <section 
      ref={statsRef}
      className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="container-atlas">
        <div className={`text-center mb-16 transition-all duration-1000 transform ${statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            The Global Career Crisis
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Millions of professionals worldwide are struggling with career dissatisfaction and uncertainty. 
            The data reveals a stark reality about the modern workplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transform transition-all duration-700 hover:scale-105 ${
                statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className={`text-3xl font-bold mb-2 ${stat.color}`}>
                    {stat.percentage}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center transition-all duration-1000 transform ${statsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '700ms' }}>
          <Button 
            variant="outline" 
            size="lg"
            className="bg-white hover:bg-gray-50 text-atlas-navy border-atlas-navy hover:border-atlas-blue transition-all duration-300"
          >
            Read the Report
          </Button>
        </div>
      </div>
    </section>
  );
};

export default JobDissatisfactionStats;

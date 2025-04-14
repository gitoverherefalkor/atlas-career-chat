import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Atlas Assessment gave me insights about my working style that I had never considered before. The interactive chat format made it easy to dig deeper into areas that were most relevant to my situation.",
      name: "Sarah J.",
      role: "Marketing Professional",
      stars: 5
    },
    {
      quote: "As someone contemplating a career change, this assessment was exactly what I needed. It helped me understand which of my skills are transferable and which industries might be the best fit.",
      name: "Michael T.",
      role: "Finance to Tech Transition",
      stars: 5
    },
    {
      quote: "The personalized nature of the AI chat made this much more valuable than other assessments I've taken. I could ask follow-up questions and get clarification on specific points.",
      name: "Rebecca L.",
      role: "Recent Graduate",
      stars: 4
    }
  ];

  return (
    <section className="section bg-white">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Hear From Our Beta Users</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-navy mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {Array(testimonial.stars).fill(0).map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold text-gray-600">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

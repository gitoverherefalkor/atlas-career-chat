
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Examples = () => {
  return <section id="examples" className="section bg-gray-50">
      <div className="container-atlas">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See Atlas Assessment in Action</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-atlas-blue to-atlas-navy mx-auto"></div>
        </div>

        <Tabs defaultValue="questionnaire" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
            <TabsTrigger value="chat1">Chat Example 1</TabsTrigger>
            <TabsTrigger value="chat2">Chat Example 2</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questionnaire">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <div className="bg-gray-800 text-white p-3 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-2 text-sm">Atlas Assessment Questionnaire</div>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-1">Question 12 of 40</h3>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div className="bg-primary h-2 rounded-full" style={{
                      width: '30%'
                    }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-medium mb-4">In a team, you tend to:*</h4>
                      <div className="space-y-3">
                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="h-5 w-5 border border-gray-400 rounded-full mr-3 flex items-center justify-center text-xs font-medium">
                            A
                          </div>
                          <span><strong className="text-blue-700">Take charge</strong> and guide the direction of the group.</span>
                        </div>
                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="h-5 w-5 border border-gray-400 rounded-full mr-3 flex items-center justify-center text-xs font-medium">
                            B
                          </div>
                          <span><strong className="text-blue-700">Step back to analyze</strong> before contributing.</span>
                        </div>
                        <div className="flex items-center p-3 border border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                          <div className="h-5 w-5 border border-blue-500 bg-blue-100 rounded-full mr-3 flex items-center justify-center text-xs font-medium text-blue-700">
                            C
                          </div>
                          <span><strong className="text-blue-700">Offer ideas</strong> and actively engage in discussions.</span>
                        </div>
                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="h-5 w-5 border border-gray-400 rounded-full mr-3 flex items-center justify-center text-xs font-medium">
                            D
                          </div>
                          <span><strong className="text-blue-700">Ensure execution</strong> by keeping tasks organized and on track.</span>
                        </div>
                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="h-5 w-5 border border-gray-400 rounded-full mr-3 flex items-center justify-center text-xs font-medium">
                            E
                          </div>
                          <span><strong className="text-blue-700">Work independently</strong> but provide support when needed.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-6">
                      <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors">
                        Previous
                      </button>
                      <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-center mt-4 text-gray-600">
              Intuitive questionnaire designed to capture your unique professional profile.
            </p>
          </TabsContent>
          
          <TabsContent value="chat1">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <div className="bg-gray-800 text-white p-3 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-2 text-sm">Atlas Assessment AI Coach</div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <p className="text-gray-800">Welcome to your Atlas Assessment results! I've analyzed your responses and I'm here to discuss your unique professional profile. Based on your answers, I see that you have strong analytical abilities paired with excellent communication skills. Would you like me to start by discussing your key strengths or your ideal work environment?</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 max-w-[80%] ml-auto">
                      <p className="text-gray-800">I'd like to hear about my key strengths first, please.</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <p className="text-gray-800">Great choice! Your assessment reveals these key strengths:</p>
                      <ul className="list-disc ml-5 mt-2 space-y-2">
                        <li>
                          <span className="font-medium">Strategic Thinking:</span> You excel at seeing the big picture and identifying patterns that others might miss.
                        </li>
                        <li>
                          <span className="font-medium">Analytical Problem-Solving:</span> You have a natural ability to break down complex problems into manageable components.
                        </li>
                        <li>
                          <span className="font-medium">Interpersonal Communication:</span> You're skilled at conveying complex ideas in accessible ways.
                        </li>
                      </ul>
                      <p className="mt-2">Would you like me to suggest some careers that leverage these strengths particularly well?</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-center mt-4 text-gray-600">
              Engage in a dynamic conversation about your results with your AI career coach.
            </p>
          </TabsContent>
          
          <TabsContent value="chat2">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <div className="bg-gray-800 text-white p-3 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-2 text-sm">Atlas Assessment AI Coach</div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-primary/10 rounded-lg p-4 max-w-[80%] ml-auto">
                      <p className="text-gray-800">Based on my results, what work environments would best suit my personality?</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 max-w-[80%]">
                      <p className="text-gray-800">Based on your profile, you would thrive in these work environments:</p>
                      <ul className="list-disc ml-5 mt-2 space-y-2">
                        <li>
                          <span className="font-medium">Collaborative yet autonomous:</span> You value teamwork but also need space to develop and execute your own ideas.
                        </li>
                        <li>
                          <span className="font-medium">Intellectually stimulating:</span> Environments that present regular challenges and learning opportunities would keep you engaged.
                        </li>
                        <li>
                          <span className="font-medium">Impact-focused:</span> You're motivated by seeing the tangible results of your work and how it benefits others.
                        </li>
                      </ul>
                      <p className="mt-2">Organizations with flat hierarchies, regular feedback loops, and a culture of innovation would align well with your preferences.</p>
                      <p className="mt-2">Would you like specific examples of company cultures or industries that often provide these environments?</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 max-w-[80%] ml-auto">
                      <p className="text-gray-800">Yes, please suggest some specific industries that might be a good fit.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-center mt-4 text-gray-600">
              Ask questions and explore career paths relevant to your specific profile.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </section>;
};
export default Examples;

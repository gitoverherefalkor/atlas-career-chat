
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PurchaseAccessButton = () => {
  const navigate = useNavigate();

  const handlePurchase = () => {
    // Navigate to homepage where the purchase flow is handled
    navigate('/?purchase=true');
  };

  return (
    <Card className="border-2 border-dashed border-atlas-teal bg-gradient-to-r from-atlas-teal/5 to-atlas-blue/5 hover:shadow-lg transition-shadow cursor-pointer" onClick={handlePurchase}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-atlas-teal/10 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-atlas-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Purchase Assessment Access</h3>
              <p className="text-sm text-gray-600">Get your access code to start the assessment - €39.00</p>
            </div>
          </div>
          <Button className="bg-atlas-teal hover:bg-atlas-teal/90 text-white">
            Get
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseAccessButton;

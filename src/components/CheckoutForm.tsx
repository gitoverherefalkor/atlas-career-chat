import React, { useState, useEffect } from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  country: z.string().min(2, {
    message: "Please select a country.",
  }),
  businessName: z.string().optional(),
  vatNumber: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof formSchema>;

// Common countries list
const countries = [
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", 
  "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", 
  "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", 
  "Slovenia", "Spain", "Sweden", "United Kingdom", "United States", 
  "Canada", "Australia", "New Zealand", "Japan", "China", "India"
];

// Helper function to extract names from OAuth metadata
function extractUserNames(user: any, profile: any) {
  // Try to get first and last name from various OAuth provider fields
  let firstName = '';
  let lastName = '';
  
  // Priority order for first name
  if (profile?.first_name) {
    firstName = profile.first_name;
  } else if (user?.user_metadata?.given_name) {
    firstName = user.user_metadata.given_name;
  } else if (user?.user_metadata?.first_name) {
    firstName = user.user_metadata.first_name;
  } else if (user?.user_metadata?.name) {
    // For LinkedIn, sometimes the full name is in 'name' field
    firstName = user.user_metadata.name.split(' ')[0] || '';
  } else if (user?.user_metadata?.full_name) {
    firstName = user.user_metadata.full_name.split(' ')[0] || '';
  } else if (user?.user_metadata?.displayName) {
    firstName = user.user_metadata.displayName.split(' ')[0] || '';
  }
  
  // Priority order for last name
  if (profile?.last_name) {
    lastName = profile.last_name;
  } else if (user?.user_metadata?.family_name) {
    lastName = user.user_metadata.family_name;
  } else if (user?.user_metadata?.last_name) {
    lastName = user.user_metadata.last_name;
  } else if (user?.user_metadata?.name) {
    // For LinkedIn, extract last name from full name
    const nameParts = user.user_metadata.name.split(' ');
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  } else if (user?.user_metadata?.full_name) {
    const nameParts = user.user_metadata.full_name.split(' ');
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  } else if (user?.user_metadata?.displayName) {
    const nameParts = user.user_metadata.displayName.split(' ');
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  }
  
  return { firstName: firstName.trim(), lastName: lastName.trim() };
}

// Helper function to extract email
function extractUserEmail(user: any, profile: any) {
  return user?.email || 
         profile?.email || 
         user?.user_metadata?.email || 
         user?.user_metadata?.email_address || 
         '';
}

export function CheckoutForm() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      country: '',
      businessName: '',
      vatNumber: '',
    },
  });

  // Effect to update form values when user or profile changes
  useEffect(() => {
    if (user || profile) {
      const { firstName, lastName } = extractUserNames(user, profile);
      const email = extractUserEmail(user, profile);
      const country = profile?.country || '';
      
      // Only update if the field is currently empty or if it's the default value
      // This preserves user edits while updating on login/logout
      const currentValues = form.getValues();
      
      const updates: Partial<CheckoutFormValues> = {};
      
      if (firstName && (!currentValues.firstName || currentValues.firstName === '')) {
        updates.firstName = firstName;
      }
      
      if (lastName && (!currentValues.lastName || currentValues.lastName === '')) {
        updates.lastName = lastName;
      }
      
      if (email && (!currentValues.email || currentValues.email === '')) {
        updates.email = email;
      }
      
      if (country && (!currentValues.country || currentValues.country === '')) {
        updates.country = country;
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        form.reset({
          ...currentValues,
          ...updates,
        });
      }
    }
  }, [user, profile, form]);

  async function onSubmit(values: CheckoutFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Store country in localStorage for profile update after payment/signup
      localStorage.setItem('payment_country', values.country);

      const { data, error: apiError } = await supabase.functions.invoke("create-checkout", {
        body: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          country: values.country,
          businessName: values.businessName,
          vatNumber: values.vatNumber,
        },
      });

      if (apiError) {
        console.error("API error:", apiError);
        throw new Error(apiError.message);
      }

      if (!data) {
        throw new Error("No data returned from API");
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session: No URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      // Show a more detailed error for common issues
      if (errorMessage.includes("Invalid API Key")) {
        setError("Payment system is not properly configured. Please try again later or contact support.");
      } else if (errorMessage.includes("account") && errorMessage.includes("active")) {
        setError("Payment system is not activated yet. Please try again later.");
      } else {
        setError(errorMessage);
      }
      
      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl shadow-lg bg-white/90 p-8 border border-gray-200">
      <div className="mb-6 text-center">
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-atlas-navy drop-shadow-sm">
          Your Information
        </h2>
        <p className="mt-2 text-gray-600 text-base">
          Please fill in your details below. Business customers can enter their company info for invoicing.
        </p>
      </div>
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="John" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name <span className="text-xs text-gray-400">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Atlas Solutions BV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Number <span className="text-xs text-gray-400">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="NL123456789B01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        {error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
          <Button type="submit" className="w-full bg-gradient-to-r from-atlas-blue to-atlas-navy text-white font-bold py-3 rounded-lg shadow-lg hover:scale-105 transition-transform duration-150" disabled={isLoading}>
          {isLoading ? "Processing..." : "Proceed to Checkout"}
        </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
          This will redirect you to our secure payment processor
        </p>
      </form>
    </Form>
    </div>
  );
}
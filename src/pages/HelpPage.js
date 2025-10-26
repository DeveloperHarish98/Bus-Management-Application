import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  ExpandMore,
  Phone,
  Email,
  Info,
  HelpOutline,
  QuestionAnswer,
  SupportAgent,
  AccessTime,
  Room
} from '@mui/icons-material';

const faqs = [
  {
    question: 'How do I book a bus ticket?',
    answer: 'To book a bus ticket, go to the Bus Schedule page, select your route, choose a bus, select your seats, and proceed to payment.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards, UPI, and net banking for ticket payments.'
  },
  {
    question: 'Can I cancel my ticket?',
    answer: 'Yes, you can cancel your ticket from the My Bookings section. Please note that cancellation charges may apply based on the time of cancellation.'
  },
  {
    question: 'How do I track my bus?',
    answer: 'You can track your bus in real-time through the My Bookings section once your booking is confirmed.'
  },
  {
    question: 'Do you offer any discounts?',
    answer: 'Yes, we offer various discounts for students, senior citizens, and group bookings. Check our Offers page for current promotions.'
  }
];

const contactInfo = [
  { icon: <Phone />, text: '+91 98765 43210', type: 'phone' },
  { icon: <Email />, text: 'support@busmanagement.com', type: 'email' },
  { icon: <Room />, text: '123 Bus Stand Road, Bhubaneswar, Odisha 751001', type: 'address' },
  { icon: <AccessTime />, text: '24/7 Customer Support', type: 'hours' }
];

const HelpPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom>
          <HelpOutline sx={{ verticalAlign: 'middle', mr: 2 }} />
          Help & Support
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find answers to common questions or contact our support team
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* FAQ Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <QuestionAnswer sx={{ mr: 1 }} />
            Frequently Asked Questions
          </Typography>
          
          {faqs.map((faq, index) => (
            <Accordion key={index} elevation={2} sx={{ mb: 1, borderRadius: 1, overflow: 'hidden' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="medium">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SupportAgent sx={{ mr: 1 }} />
                Contact Us
              </Typography>
              <List>
                {contactInfo.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text}
                        primaryTypographyProps={{
                          color: item.type === 'email' ? 'primary' : 'text.primary',
                          sx: { 
                            textDecoration: item.type === 'email' ? 'underline' : 'none',
                            cursor: item.type === 'email' ? 'pointer' : 'default'
                          }
                        }}
                      />
                    </ListItem>
                    {index < contactInfo.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} />
                Quick Links
              </Typography>
              <List>
                <ListItem button component="a" href="/terms">
                  <ListItemText primary="Terms & Conditions" />
                </ListItem>
                <Divider />
                <ListItem button component="a" href="/privacy">
                  <ListItemText primary="Privacy Policy" />
                </ListItem>
                <Divider />
                <ListItem button component="a" href="/refund">
                  <ListItemText primary="Refund Policy" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HelpPage;
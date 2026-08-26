import { Container, Typography, Box, Paper } from '@mui/material';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

export default function TermsPage() {
  return (
    <Layout>
      <Seo title="Terms & Conditions | Digital Home" description="Terms of Service, Disclaimer, and Affiliate Disclosure for Digital Home blog." />

      <Box sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 }, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
          Legal
        </Typography>
        <Typography variant="h2" component="h1" sx={{ fontWeight: 700, mt: 2, mb: 2 }}>
          Terms & Disclaimer
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 6 }}>
          Last updated: May 12, 2026
        </Typography>

        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <Section title="1. Acceptance of Terms">
            By accessing and using Digital Home ("the Blog"), you agree to comply with and be bound by these
            Terms & Conditions. If you do not agree with any part of these terms, please do not use our website.
          </Section>

          <Section title="2. Content Disclaimer">
            All content on this blog is for informational and educational purposes only. We make no
            representations or warranties regarding the accuracy, completeness, or reliability of any
            information published. Any reliance you place on such information is strictly at your own risk.
            The views expressed are personal opinions and do not constitute professional advice.
          </Section>

          <Section title="3. Affiliate Disclosure">
            Digital Home may contain affiliate links. If you click on an affiliate link and make a purchase,
            we may earn a small commission at no additional cost to you. We only recommend products and
            services that we genuinely believe add value to our readers. Affiliate relationships do not
            influence our editorial content.
          </Section>

          <Section title="4. Use of AI-Generated Content">
            Some content on this blog may be generated or assisted by artificial intelligence tools. All
            AI-generated content is reviewed, edited, and fact-checked by human editors before publication
            to ensure quality and accuracy.
          </Section>

          <Section title="5. Intellectual Property">
            Unless otherwise stated, all content on Digital Home — including text, images, and code — is
            the property of Digital Home and is protected by applicable copyright laws. You may not
            reproduce, distribute, or republish content without prior written permission.
          </Section>

          <Section title="6. Comments & User Content">
            Users may post comments on the blog. We reserve the right to moderate, edit, or remove any
            comments that are spam, offensive, or irrelevant. By posting a comment, you grant us a
            non-exclusive license to use that content on our platform.
          </Section>

          <Section title="7. Limitation of Liability">
            Digital Home shall not be held liable for any damages arising from the use or inability to use
            the blog, including but not limited to direct, indirect, incidental, or consequential damages.
          </Section>

          <Section title="8. External Links">
            Our blog may contain links to third-party websites. We are not responsible for the content,
            privacy policies, or practices of these external sites. Clicking on external links is at your
            own risk.
          </Section>

          <Section title="9. Changes to Terms">
            We reserve the right to update or modify these terms at any time without prior notice. Changes
            are effective immediately upon posting. It is your responsibility to review these terms
            periodically.
          </Section>

          <Section title="10. Contact Us">
            If you have any questions about these Terms & Conditions, please contact us at{' '}
            <Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              contact@digitalhomeblog.in
            </Typography>.
          </Section>
        </Paper>
      </Box>
    </Layout>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.9 }}>
        {children}
      </Typography>
    </Box>
  );
}
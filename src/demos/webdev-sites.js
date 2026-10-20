// The client sites shown in the web development demo. Every business here is fictional: names were
// checked against real UK firms, phone numbers sit in Ofcom's drama ranges (0121 496 0xxx, 07700 900xxx).
// Each site is drawn at 1200 x 780 and scaled to fit; styles live in webdev-sites.css.
import clinicImg from '../assets/demo/clinic.webp';
import cafeImg from '../assets/demo/cafe.webp';
import barImg from '../assets/demo/bar.webp';
import salonImg from '../assets/demo/salon.webp';
import garageImg from '../assets/demo/garage.webp';
import financeImg from '../assets/demo/finance.webp';

const bg = (url) => `style="background-image:url(${url})"`;

/* ---------------------------------------------------------------- physiotherapy clinic */
const physio = {
  id: 'physio',
  kind: 'Physio',
  name: 'Harbour Lane',
  initial: 'H',
  fav: '#4F6F5D',
  url: 'harbourlanephysio.co.uk',
  img: clinicImg,
  fonts: [],
  notes: ['Book online in two taps', 'Prices and reviews up front', 'Built mobile-first and fast'],
  before: () => `
<div class="old">
  <div class="old__top">
    <div class="old__logo">Harbour Lane Physio</div>
    <div class="old__phone">CALL US TO BOOK!!<small>Mon–Fri 9am–5pm (closed lunch)</small></div>
  </div>
  <div class="old__nav"><a>Home</a><a>About Us</a><a>Prices (PDF)</a><a>Directions</a><a>Contact</a><a>Links</a></div>
  <div class="old__marquee"><span>*** WELCOME TO OUR NEW WEBSITE *** Online booking coming soon!! *** Please phone to make an appointment ***</span></div>
  <div class="old__body">
    <div class="old__side">
      <p class="old__h4">Quick Links</p>
      <ul style="padding-left:18px;margin:0"><li>Back Pain</li><li>Sports Injury</li><li>Download Price List (PDF, 4MB)</li><li>Find Us</li><li>Guestbook</li></ul>
      <p style="margin-top:18px">You are visitor number <span class="old__counter">004187</span></p>
    </div>
    <div class="old__main">
      <p class="old__h1">Welcome to Harbour Lane Physiotherapy!</p>
      <div class="old__img" ${bg(clinicImg)}></div>
      <p>We are a physiotherapy practice. We treat many conditions including back pain, neck pain, sports injuries and much more. Our physiotherapists are fully qualified.</p>
      <p>To book an appointment please telephone the clinic during opening hours. If the line is busy please try again later or leave a message and we will try to call you back.</p>
      <p>Prices are available in our downloadable price list.</p>
      <span class="old__cta">☎ PHONE NOW TO BOOK</span>
    </div>
  </div>
  <div class="old__foot"><span>© Harbour Lane Physio. Best viewed in Internet Explorer at 1024x768.</span><span>Last updated: March 2014</span></div>
</div>`,
  after: () => `
<div class="new">
  <div class="new__nav">
    <div class="new__brand"><i></i>Harbour Lane</div>
    <div class="new__links"><span>Treatments</span><span>Prices</span><span>Our team</span><span>Find us</span></div>
    <span class="new__book">Book online</span>
  </div>
  <div class="new__hero">
    <div>
      <p class="new__eyebrow">Physiotherapy · Moseley, Birmingham</p>
      <h2 class="new__h1">Move without<br/> pain <em>again.</em></h2>
      <p class="new__p">Assessment, hands-on treatment and a plan you can follow at home. Book a time that suits you in under a minute.</p>
      <div class="new__ctas"><span>Book online</span><span>Free 15-minute call</span></div>
      <div class="new__proof"><span class="new__stars">★★★★★</span><span>4.9 from 212 Google reviews</span></div>
    </div>
    <div class="new__img" ${bg(clinicImg)}>
      <div class="new__chip"><small>NEXT AVAILABLE</small><b>Tomorrow, 9:30</b><span>Initial assessment · £60</span></div>
    </div>
  </div>
</div>`,
};

/* ---------------------------------------------------------------- café and bakery */
const cafe = {
  id: 'cafe',
  kind: 'Café',
  name: 'Ember &amp; Oat',
  initial: 'E',
  fav: '#C4623A',
  url: 'emberandoat.co.uk',
  img: cafeImg,
  fonts: ['400 20px "Fraunces Variable"', 'italic 400 20px "Fraunces Variable"'],
  notes: ['Order ahead, skip the queue', 'Today’s bakes, updated from the till', 'Found on Maps for “brunch near me”'],
  before: () => `
<div class="cfo">
  <div class="cfo__wrap">
    <div class="cfo__banner"><i ${bg(cafeImg)}></i><span>Ember &amp; Oat Cafe</span></div>
    <div class="cfo__nav"><span class="is-on">Home</span><span>Our Menu</span><span>Gallery</span><span>Find Us</span><span>Contact Us</span></div>
    <div class="cfo__body">
      <div class="cfo__main">
        <p class="cfo__h1">Welcome!!</p>
        <p>Welcome to the Ember &amp; Oat Cafe website. We are a family run cafe on the high street in Kings Heath serving hot and cold drinks, homemade cakes, sandwiches, jacket potatoes and much more. Come and see us!</p>
        <p>Our full menu is on the board in the cafe. <i>Prices may vary.</i></p>
        <p class="cfo__xmas">*** NOW TAKING BOOKINGS FOR CHRISTMAS PARTIES 2017 ***</p>
        <p>For bookings or to check we are open please ring <b>0121 496 0284</b> or send us a message on Facebook.</p>
      </div>
      <div class="cfo__side">
        <div class="cfo__box"><p class="cfo__h4">Opening Times</p><p><b>Mon – Fri</b> 8am – 4pm</p><p><b>Saturday</b> 9am – 4pm</p><p><b>Sunday</b> Closed*</p><small>*sometimes open, please ring to check</small></div>
        <div class="cfo__fb"><b>f</b> Find us on Facebook<small>Like · 212 people like this</small></div>
        <div class="cfo__box"><p class="cfo__h4">Our Menu</p><u>Click here to view our menu</u><br/><small>(menu_NEW_final2.jpg, 6.2 MB)</small></div>
      </div>
    </div>
    <div class="cfo__foot">© 2016 Ember &amp; Oat Cafe · Website created with SiteBuilderFree · <u>Report abuse</u></div>
  </div>
</div>`,
  after: () => `
<div class="cf">
  <div class="cf__ann">Cardamom knots out of the oven at 8:15 <span>·</span> <u>Order ahead and skip the queue</u></div>
  <div class="cf__nav">
    <div class="cf__logo"><svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M1.5 14a12.5 12.5 0 0 0 25 0z" fill="#C4623A"/><path d="M14 4.5v4M7.3 7.3l2.2 2.2M20.7 7.3l-2.2 2.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>Ember &amp; Oat</div>
    <div class="cf__links"><span>Menu</span><span>Bakery</span><span>Brunch</span><span>Our coffee</span><span>Visit</span></div>
    <span class="cf__open"><i></i>Open now · until 4pm</span>
    <span class="cf__btn">Order ahead</span>
  </div>
  <div class="cf__hero">
    <div>
      <p class="cf__eyebrow">Coffee · Bakes · Brunch — Kings Heath</p>
      <h2 class="cf__h1">Slow mornings,<br/><em>warm</em> bakes.</h2>
      <p class="cf__p">Sourdough baked before sunrise, seasonal brunch until 2pm and coffee roasted three streets away. Pull up a chair, or order ahead and pick it up on your way.</p>
      <div class="cf__ctas"><span>Order ahead · ready in 10 min</span><span>Today’s menu</span></div>
      <div class="cf__facts"><span><b>4.8 ★</b> 1,140 Google reviews</span><span>Dogs welcome</span><span>Oat milk at no extra cost</span></div>
    </div>
    <div class="cf__media" ${bg(cafeImg)}>
      <svg class="cf__badge" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="cf-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs><text><textPath href="#cf-ring" textLength="272">BAKED FRESH EVERY MORNING · KINGS HEATH ·</textPath></text><circle cx="60" cy="60" r="16" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M44 60a16 16 0 0 0 32 0z" fill="currentColor"/></svg>
      <div class="cf__today">
        <small>From the oven today</small>
        <p><span>Cardamom knot</span><b>£3.40</b></p>
        <p><span>Cinnamon swirl</span><b>£3.20</b></p>
        <p><span>Seeded sourdough loaf</span><b>£5.50</b></p>
      </div>
    </div>
  </div>
  <div class="cf__menu">
    <div><small>Brunch</small><b>Shakshuka, whipped feta &amp; chilli butter</b><span>£11.50</span></div>
    <div><small>Brunch</small><b>Sourdough, crushed avocado, dukkah egg</b><span>£10.00</span></div>
    <div><small>Sweet</small><b>Ricotta hotcakes, poached rhubarb</b><span>£9.50</span></div>
    <div><small>Coffee</small><b>Flat white, Kings Heath house blend</b><span>£3.30</span></div>
  </div>
</div>`,
};

/* ---------------------------------------------------------------- cocktail bar */
const bar = {
  id: 'bar',
  kind: 'Bar',
  name: 'The Copper Moth',
  initial: 'M',
  fav: '#1E2B25',
  url: 'thecoppermoth.co.uk',
  img: barImg,
  fonts: ['300 20px "Cormorant Variable"', 'italic 400 20px "Cormorant Variable"'],
  notes: ['Table bookings with deposits', 'Events and private-hire enquiries', 'Moody, yet loads in a second'],
  before: () => `
<div class="bmo">
  <div class="bmo__head">
    <p class="bmo__h1">~*~ THE COPPER MOTH ~*~</p>
    <p class="bmo__sub">COCKTAIL BAR &amp; LOUNGE • JEWELLERY QUARTER</p>
    <span class="bmo__18">18+ ONLY</span>
  </div>
  <div class="bmo__player"><span>♫</span> Now playing: <b>chillout_lounge_mix_2009.mp3</b><span class="bmo__ctl">▶ ❚❚ ■</span><i>autoplay: ON</i></div>
  <div class="bmo__nav"><span>HOME</span><span>DRINKS</span><span>GALLERY</span><span>VIP LIST</span><span>MAP</span></div>
  <div class="bmo__body">
    <div class="bmo__flash"><i></i><b>Click to enable Adobe Flash Player</b><small>Our drinks menu needs Flash Player 10 or later</small></div>
    <div class="bmo__main">
      <p class="bmo__h2">WELCOME TO THE HOTTEST BAR IN THE JQ!!!</p>
      <p>Cocktails • Shots • Pitchers • Bottle Service • Shisha Terrace (coming soon)</p>
      <p class="bmo__blink">THURSDAY = LADIES NITE 2-4-1 ALL NIGHT!!</p>
      <p>To book a table or VIP booth TEXT or CALL Kev on <b>07700 900461</b>. Please include your name, the date and how many people. We will try to reply.</p>
      <p>Smart dress. No trainers. No caps. Management reserve the right to refuse entry.</p>
      <p class="bmo__links"><u>Photos from Saturday</u> | <u>Join our mailing list</u> | <u>Sign the guestbook</u></p>
    </div>
  </div>
  <div class="bmo__foot">Copyright © 2011 The Copper Moth. All Rights Reserved. Site designed by KevDesigns. Best viewed in Firefox 3.</div>
</div>`,
  after: () => `
<div class="bm">
  <div class="bm__bg" ${bg(barImg)}></div>
  <div class="bm__shade"></div>
  <div class="bm__nav">
    <div class="bm__links"><span>Cocktails</span><span>Events</span><span>Private hire</span></div>
    <div class="bm__logo"><svg viewBox="0 0 40 26" aria-hidden="true"><path d="M20 5c-1.6 0-2.4 3.2-2.4 8.2 0 4.6 1 8.4 2.4 9.8 1.4-1.4 2.4-5.2 2.4-9.8C22.4 8.2 21.6 5 20 5z" fill="currentColor"/><path d="M18 9.5C13 3 4 1.5 1.6 4.2.2 6.6 4 12.5 10.5 14c-3.6 1.8-5.4 5.8-3.6 7.4 2.4 1.8 7.6-2.2 10.6-7.8M22 9.5C27 3 36 1.5 38.4 4.2c1.4 2.4-2.4 8.3-8.9 9.8 3.6 1.8 5.4 5.8 3.6 7.4-2.4 1.8-7.6-2.2-10.6-7.8M19 5.4 16 1M21 5.4 24 1" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg><b>The Copper Moth</b></div>
    <div class="bm__right"><span>Find us</span><span class="bm__book">Book a table</span></div>
  </div>
  <div class="bm__copy">
    <p class="bm__eyebrow">Cocktail bar · Jewellery Quarter</p>
    <h2 class="bm__h1">After dark,<br/><em>we pour slowly.</em></h2>
    <p class="bm__p">Forty seats, a long brass bar and a seasonal list built on British spirits. Tucked down Vyse Street, open late Wednesday to Sunday.</p>
    <div class="bm__ctas"><span>Book a table</span><span>See the cocktail list</span></div>
  </div>
  <div class="bm__booking">
    <div><small>Date</small><b>Tonight</b></div>
    <div><small>Guests</small><b>2 people</b></div>
    <div><small>Time</small><b>9:00 pm</b></div>
    <span>Find a table</span>
    <p class="bm__left"><i></i>3 tables left tonight · deposit refunded if you cancel 24 hours ahead</p>
  </div>
  <div class="bm__week">
    <small>This week at the Moth</small>
    <p><b>Thu</b><span>Live jazz trio</span><em>From 9pm · free entry</em></p>
    <p><b>Fri</b><span>Vinyl night, resident DJs</span><em>Until 2am</em></p>
    <p><b>Sat</b><span>Mezcal masterclass</span><em>6pm · £35 · 4 places left</em></p>
  </div>
  <div class="bm__hours">Wed – Thu 5pm – midnight<br/>Fri – Sat 5pm – 2am · Sun 4pm – 11pm</div>
</div>`,
};

/* ---------------------------------------------------------------- hair salon */
const salon = {
  id: 'salon',
  kind: 'Salon',
  name: 'Juniper Row',
  initial: 'J',
  fav: '#3A1E2A',
  url: 'juniperrow.co.uk',
  img: salonImg,
  fonts: ['500 20px "Bodoni Moda Variable"', 'italic 400 20px "Bodoni Moda Variable"'],
  notes: ['Pick a service, stylist and time', 'Real prices, no “call for a quote”', 'Gift cards sold online'],
  before: () => `
<div class="jro">
  <div class="jro__box">
    <p class="jro__h1">Juniper Row Hair &amp; Beauty</p>
    <p class="jro__tag">~ Cuts ~ Colours ~ Perms ~ Nails ~ Brows ~</p>
    <div class="jro__nav"><span>HOME</span>|<span>PRICES</span>|<span>GALLERY</span>|<span>OFFERS</span>|<span>CONTACT</span></div>
    <div class="jro__cols">
      <div class="jro__img" ${bg(salonImg)}></div>
      <div>
        <p class="jro__h2">Welcome to Juniper Row!!!</p>
        <p>We do Cuts, Colours, Highlights, Perms, Extensions, Nails, Eyebrows and much much more!! Walk-ins sometimes available, please ask.</p>
        <p><b>PRICE LIST:</b> prices on request, please ask in salon.</p>
        <p class="jro__offer">★ OFFER ★ 10% off highlights on Tuesdays!! (ends 31/08/2013)</p>
        <p>To book call Jade on <b>0121 496 0352</b>. If there is no answer please leave a message and we will call you back.</p>
      </div>
    </div>
    <div class="jro__soon">✧ Gallery coming soon!! ✧ Check back for photos of our work ✧</div>
    <p class="jro__foot">Find us on Facebook &amp; Bebo! &nbsp;|&nbsp; Last updated 03/09/2013</p>
  </div>
</div>`,
  after: () => `
<div class="jr">
  <div class="jr__nav">
    <div class="jr__links"><span>Services</span><span>Colour</span><span>Stylists</span><span>Journal</span></div>
    <div class="jr__logo">JUNIPER ROW<small>HAIR STUDIO · HARBORNE</small></div>
    <div class="jr__right"><span>Gift cards</span><b>Book now</b></div>
  </div>
  <div class="jr__rule"></div>
  <div class="jr__copy">
    <p class="jr__eyebrow">Colour specialists since 2016</p>
    <h2 class="jr__h1">Colour that <em>grows out</em> beautifully.</h2>
    <p class="jr__p">Balayage, lived-in blondes and precision cuts in a calm, light-filled studio on Harborne High Street. Every appointment starts with a proper consultation.</p>
    <div class="jr__ctas"><span>Book an appointment</span><span>See our work</span></div>
  </div>
  <div class="jr__img" ${bg(salonImg)}><span>Lived-in balayage by Mia</span></div>
  <div class="jr__book">
    <p class="jr__bookh">Book online <span>Step 1 of 3</span></p>
    <div class="jr__svc is-on"><i></i><div><b>Balayage &amp; toner</b><small>3 hrs · blow-dry included</small></div><span>from £165</span></div>
    <div class="jr__svc"><i></i><div><b>Cut &amp; blow-dry</b><small>1 hr</small></div><span>from £62</span></div>
    <div class="jr__svc"><i></i><div><b>Gloss &amp; treatment</b><small>45 mins</small></div><span>£48</span></div>
    <p class="jr__lbl">Choose your stylist</p>
    <div class="jr__team"><span class="is-on"><i style="--c:#B27C74">M</i>Mia</span><span><i style="--c:#7E5A64">L</i>Leah</span><span><i style="--c:#C9A48E">S</i>Sam</span><span><i style="--c:#D9C3BC">+</i>Anyone</span></div>
    <div class="jr__next"><div><small>Next free with Mia</small><b>Sat, 10:15am</b></div><span>Continue</span></div>
  </div>
  <div class="jr__strip">
    <span><b>01</b>Free consultation &amp; strand test</span>
    <span><b>02</b>Bond repair in every colour</span>
    <span><b>03</b>★ 4.9 from 386 reviews</span>
  </div>
</div>`,
};

/* ---------------------------------------------------------------- independent garage */
const garage = {
  id: 'garage',
  kind: 'Garage',
  name: 'Pryor &amp; Daughters',
  initial: 'P',
  fav: '#E0A800',
  url: 'pryoranddaughters.co.uk',
  img: garageImg,
  fonts: ['900 20px "Archivo Variable"'],
  notes: ['Reg lookup with instant prices', 'MOT reminders by text', 'Google reviews built in'],
  before: () => `
<div class="pdo">
  <div class="pdo__head"><p class="pdo__h1">PRYOR &amp; DAUGHTERS MOTORS</p><p class="pdo__sub">M.O.T.'s - Servicing - Repairs - Tyres - Exhausts</p></div>
  <div class="pdo__tape"><span>SITE UNDER CONSTRUCTION - PLEASE CALL</span></div>
  <div class="pdo__body">
    <div class="pdo__left">
      <p class="pdo__h2">WELCOME</p>
      <p>We are a family run garage in Acocks Green established in 1987. We carry out MOT'S, SERVICING, REPAIRS, TYRES, EXHAUSTS, CLUTCHES, BRAKES, WELDING, DIAGNOSTICS and AIR CON on ALL MAKES AND MODELS.</p>
      <p class="pdo__red">PHONE FOR A PRICE: 0121 496 0718</p>
      <p>Opening times: Mon-Fri 8.00am - 5.30pm, Sat 8.00am - 12.00 noon. Closed Sundays and Bank Holidays.</p>
      <p class="pdo__cash">*** CASH OR CHEQUE ONLY - NO CARDS ***</p>
      <p><u>Click here for a map (Multimap)</u> &nbsp; <u>Links</u> &nbsp; <u>Used cars for sale</u></p>
    </div>
    <div class="pdo__right">
      <div class="pdo__img" ${bg(garageImg)}></div>
      <p class="pdo__cap">Our workshop</p>
      <div class="pdo__form"><b>Contact us</b><span>Name: <i></i></span><span>Reg No: <i></i></span><span>Message: <i></i></span><em>Submit</em></div>
    </div>
  </div>
  <div class="pdo__foot">© 2009 Pryor &amp; Daughters Motors · Website by a friend of the family · Best viewed at 800x600</div>
</div>`,
  after: () => `
<div class="pd">
  <div class="pd__util"><span>Open today <b>8:00 – 17:30</b> · Saturday 8:00 – 13:00</span><span>Free courtesy cars · <b>0121 496 0718</b></span></div>
  <div class="pd__nav">
    <div class="pd__logo"><i>P&amp;D</i><div><b>Pryor &amp; Daughters</b><small>Motor Works · Est. 1987</small></div></div>
    <div class="pd__links"><span>MOT</span><span>Servicing</span><span>Repairs</span><span>Tyres</span><span>EV &amp; hybrid</span><span>Reviews</span></div>
    <span class="pd__cta">Book online</span>
  </div>
  <div class="pd__hero">
    <div>
      <p class="pd__eyebrow">MOT, servicing &amp; repairs · Acocks Green</p>
      <h2 class="pd__h1">Honest repairs.<br/><mark>No surprises.</mark></h2>
      <p class="pd__p">Family-run for three generations. A fixed price before we start, photos of anything we find, and a free courtesy car while yours is with us.</p>
      <div class="pd__quote">
        <p class="pd__ql">Get an instant price</p>
        <div class="pd__row"><div class="pd__plate"><span>UK</span><b>WM19 KXT</b></div><span class="pd__go">Get prices</span></div>
        <p class="pd__car"><b>Volkswagen Golf 1.5 TSI · 2019</b><span>MOT due next month</span></p>
        <div class="pd__prices">
          <div><small>MOT</small><b>£54.85</b></div>
          <div><small>Full service</small><b>£219</b></div>
          <div class="is-deal"><small>MOT + full service</small><b>£249</b><em>Save £24.85</em></div>
        </div>
      </div>
    </div>
    <div class="pd__media" ${bg(garageImg)}>
      <span class="pd__flag">Same-day MOT slots</span>
      <div class="pd__review">
        <p><span class="pd__stars">★★★★★</span><span>4.9 · 640 Google reviews</span></p>
        <p>“They sent me a video of the worn brake pads before touching anything. Fair price, done by lunchtime.”</p>
        <small>Daniel R., Yardley</small>
      </div>
    </div>
  </div>
  <div class="pd__strip"><span>Approved MOT test centre</span><span>12-month parts &amp; labour guarantee</span><span>Petrol, diesel, hybrid &amp; EV</span><span>Free local collection</span></div>
</div>`,
};

/* ---------------------------------------------------------------- financial planner */
const finance = {
  id: 'finance',
  kind: 'Finance',
  name: 'Ashby Rowe',
  initial: 'A',
  fav: '#14233A',
  url: 'ashbyrowe.co.uk',
  img: financeImg,
  fonts: ['400 20px "Newsreader Variable"', 'italic 400 20px "Newsreader Variable"'],
  notes: ['Fees explained before the first call', 'A retirement plan visitors can picture', 'Compliance wording built in'],
  before: () => `
<div class="aro">
  <div class="aro__head">
    <p class="aro__logo">Ashby Rowe <span>IFA Ltd</span></p>
    <div class="aro__login"><small>Client Login:</small><span class="aro__in">Username</span><span class="aro__in">Password</span><span class="aro__go">GO</span></div>
  </div>
  <div class="aro__nav"><span>Home</span><span>About Us</span><span>Services</span><span>Pensions</span><span>Investments</span><span>Mortgages</span><span>Protection</span><span>Useful Links</span><span>Contact Us</span></div>
  <div class="aro__body">
    <div class="aro__main">
      <p class="aro__h1">Welcome to Ashby Rowe IFA Ltd</p>
      <div class="aro__img" ${bg(financeImg)}></div>
      <p>Ashby Rowe IFA Ltd are an established firm of Independent Financial Advisers offering a comprehensive range of financial services including Pensions, Investments, ISA's, Protection, Mortgages, Inheritance Tax Planning, Trusts and Equity Release to private individuals and companies throughout the Midlands and beyond.</p>
      <p>We pride ourselves on providing a professional, personal service tailored to the needs of each individual client. Please browse our website to find out more about the services we offer, or contact us to arrange an initial meeting at our offices or in the comfort of your own home.</p>
      <p>Our fees and charges are explained in our Terms of Business, available on request.</p>
      <p><u>Click here to download our Initial Disclosure Document (PDF)</u><br/><u>Click here to download our Terms of Business (PDF)</u></p>
    </div>
    <div class="aro__side">
      <div class="aro__box"><p class="aro__h4">Latest News</p><p><b>06/04/2012</b> New ISA allowance announced</p><p><b>21/03/2012</b> Budget 2012 - our summary</p><p><b>14/11/2011</b> Office closed for refurbishment</p></div>
      <div class="aro__box aro__calc"><p class="aro__h4">Pension Calculator</p><div><b>!</b> Java applet failed to load</div></div>
    </div>
  </div>
  <div class="aro__foot">Ashby Rowe IFA Ltd. Registered in England. The value of investments can go down as well as up. © 2012 &nbsp;|&nbsp; Sitemap &nbsp;|&nbsp; Disclaimer &nbsp;|&nbsp; Best viewed in 1024x768</div>
</div>`,
  after: () => `
<div class="ar">
  <div class="ar__nav">
    <div class="ar__logo"><i>AR</i><div><b>Ashby Rowe</b><small>Financial Planning</small></div></div>
    <div class="ar__links"><span>Retirement</span><span>Pensions</span><span>Investing</span><span>Later life</span><span>Our fees</span></div>
    <span class="ar__portal">Client portal</span>
    <span class="ar__cta">Book a free review</span>
  </div>
  <div class="ar__hero">
    <div>
      <p class="ar__eyebrow">Independent financial planners · Edgbaston</p>
      <h2 class="ar__h1">Retire when<br/><em>you</em> choose.</h2>
      <p class="ar__p">Independent, fee-based advice for families and business owners across the West Midlands. One fixed fee, agreed in writing. No commission, no jargon, no pressure.</p>
      <div class="ar__ctas"><span>Book a free review</span><span>How our fees work</span></div>
    </div>
    <div class="ar__media" ${bg(financeImg)}>
      <div class="ar__plan">
        <div class="ar__ph"><small>Your plan at a glance</small><span>On track</span></div>
        <div class="ar__nums"><div><small>Pot at 60</small><b>£612,000</b></div><div><small>Income from 60</small><b>£38,400<i> a year</i></b></div></div>
        <svg class="ar__chart" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="ar-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A8834A" stop-opacity=".35"/><stop offset="1" stop-color="#A8834A" stop-opacity="0"/></linearGradient></defs><path d="M0 41C30 32 50 16 63 12C120 14 220 34 300 63V100H0Z" fill="url(#ar-fill)"/><path d="M0 41C30 32 50 16 63 12C120 14 220 34 300 63" fill="none" stroke="#A8834A" stroke-width="2"/><path d="M63 12V100" stroke="#14233A" stroke-width="1" stroke-dasharray="3 3" opacity=".5"/><circle cx="63" cy="12" r="4" fill="#14233A"/></svg>
        <div class="ar__ages"><span style="left:0">52</span><span style="left:21%">60</span><span style="left:60.5%">75</span><span style="left:100%">90</span></div>
        <p class="ar__note">Illustration assuming 5% yearly growth and £650 a month. Not guaranteed.</p>
      </div>
    </div>
  </div>
  <div class="ar__trust">
    <span>Whole-of-market, independent advice</span>
    <span>Fees agreed in writing</span>
    <span>Rated 4.9 by 210 clients</span>
    <p>The value of investments, and any income from them, can fall as well as rise. You may get back less than you invest.</p>
  </div>
</div>`,
};

export const clients = [physio, cafe, bar, salon, garage, finance];

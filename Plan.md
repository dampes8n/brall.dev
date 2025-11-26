Portfolio

* Tech  
  * Physical Server  
    * Describe the server and its specs  
      * Specs  
        * GIGABYTE Z790 Eagle AX  
        * i9-14900K  
        * 128GB Crucial DDR5 5600MHz  
        * Corsair MP600 PRO XT 8TB  
        * Crucial P3 Plus 500GB  
        * NVIDIA Quadro RTX 5000  
      * Reason  
        * This server was built to fulfill four purposes:  
          * Be the ultimate media server for my hundreds of terrabytes of media  
            * Hence, the Quadro and the 8TB SSD  
          * Be an excellent AI testbed  
            * Hence the 128GB of RAM and the 14900K  
          * Be a great web server  
            * Let’s be honest, a Raspberry Pi could do this today, but this machine should be able to combine AI work with being a web server without any issues.  
          * Get all of these things off my main rig  
  * Linux  
    * Explain the choice to use Ubuntu Server Minimal  
      * Usually used in a VM, I went with the minimal Ubuntu Server because it lets me get the most out of my hardware, install the absolute minimum, and still have support, excellent documentation, and AI familiarity. Increasingly, having a setup that AI understands without having to redescribe how you did things endlessly is key to using it effectively and quickly.  
  * HTML  
    * Use proper semantic HTML  
    * Use aria roles correctly  
  * CSS  
    * Explain the use of compressed definitions  
    * Embed the core CSS in the head  
      * Embed flavor files, use JS to swap flavor files  
        * Add a style tag that makes everything have a transition  
          * Then, add the new flavor style, which will produce an animation between the two flavors  
            * Remove the old flavor style  
              * Remove the transition style tag  
        * Flavors  
          * Applebutter  
            * Buttery smooth ultraminimalism  
          * Millennial Great  
            * Grey, lots of furniture textures  
          * Wickedpedia  
            * Styled a lot like a fancy Wikipedia  
          * LitRPG  
            * Styled like a D\&D Character Sheet  
          * Offices and Overseers  
            * Like a traditional corporate website  
              * Move the main nav to the top  
          * Terminally Ill  
            * Pure CLI white on black in monospace.  
    * Use \[href$=”.filetype”\]::after { content \= url(“filetype-svg”) / var(--filetype-alt); }  
      * Define –filetype-alt in the HTML  
        * Explain this is to support translations; it isn’t needed in an application like this, but it is in most professional websites.  
  * JS  
    * Vanilla Web Components  
      * [Loader.js](http://Loader.js) that reads the incoming HTML, finds the web components, and autoloads their .js files.  
        * b-anchor component  
          * If a link goes to our same site, give it a hoverable state not available to screenreaders that gives users the option to open the link and scroll to it, not scroll to it, or a new tab.  
            * This also loads in backgrounds/foregrounds, the main content, and changes the history state and title.  
  * JSON  
    * Timeline Events  
      * Domain, Subdomain, Project, Date, Skillsets, Skills, Text  
    * Projects  
      * Domain, Subdomain, Start, End, Skillsets, Text  
    * Skills  
      * Skillsets, Text  
* UX/Design  
  * Browser  
    * Left Main Menu (with skip link to main content)  
    * Center Main Content  
      * Individual panes loaded as arbitrary html blocks  
      * Reflected in location bar  
        * \#\! Style routing because search engines understand it  
      * Links default to loading and scrolling to content lower into the Main Content section, like a new page. Screen readers see and act like a normal page load.  
        * Back button goes *back* to the previous location, doesn’t unload content.  
        * Links have a hover state that allow for loading without scrolling, hidden for screen readers  
    * Right Situational Menu (hidden to screen readers)  
      * Links in Main Content get added here to track loaded partials  
    * Backgrounds  
      * Randomized if none are found for a link  
      * Automatically loaded if one exists for a link  
      * Can be any arbitrary html  
        * Just an image  
        * A video  
        * Complex canvases  
      * Fade between each other as main content blocks reach center of the screen  
      * Blurred  
      * Fixed or parallax slowly.  
    * Foregrounds  
      * Slide in from the sides  
      * Blurred  
      * Move faster than scroll speed  
    * Post-Processing  
      * None  
      * TV Static  
      * Video Overlay  
  * JS Console  
    * Gremlin in the Machine  
      * Performs tasks with cute and disturbing callouts for every action taken  
      * Including random chatter  
      * ?Including random events that are visible in browser

    `/"""""""""""\`    
 `_ / ____   ____ \ _`  
`| \=( (@ )=( (@ )=/ |`  
``\_( ,`--'(_)`--'. )_/``  
 `( /______I______\ )`  
  `\\\_|_|_|_|_|_///`  
   ``\ `|_|_|_|_|' /``  
    `` `---.___,---' ``  
`Stef`

* Content  
  * Main Menu  
    * (Home) Resume  
      * Principal Creative Web Developer  
        * *Leading experience, architecture & aesthetics*  
      * Contact  
      * Resume Formats  
      * Objective  
      * Timeline (Academic and Employed active, Independent and Personal deactivated)  
      * Skills  
        * Links to individual skills pages  
    * Projects  
      * Spotlight  
        * Book  
        * (Obsidian Archipelago)  
        * The Elder Scrolls Online  
      * List of all Projects  
        * Links to individual project pages  
          * Project Description  
          * Timeline with just that project active  
    * Timeline  
      * Event examples  
        * My Birth  
        * Moving Locations  
        * Getting Jobs  
        * Marriage  
        * Title Changes  
        * Publishing Book  
        * Work Events  
      * Domain: Academic, Employed, Independent, and Personal  
      * Subdomain: ZeniMax Online Studios, Life, Engility/L3/MPRI, NASA…  
      * Project: Book, The Elder Scrolls Online, [Army.mil](http://Army.mil), Specific Art Projects, This Portfolio Site…  
      * Date  
      * Skillset: Leadership, Writing, Design, Development, DevOps, Database, QA, UX…  
      * Skills: D\&D, TTRPGs, GMing, Creative Writing, HTML, CSS, JavaScript, Photoshop, MySQL…  
    * About Me  
      * Who Am I  
      * What do I do  
    * My Stance on AI  
      * I don’t like how it is being done, but am staying current and won’t shy away from using it  
    * Contact  
  * Timeline Events  
    * Independant  
      * Magitism: The Force of Magic  
        * Dale Review: June 4, 2024  
        * Published: Dec 18th, 2022  
        * Began: Dec, 2021  
      * The Bronze Coin  
        * Closed \- Early 2014  
        * Opened \- July 2013  
    * Personal  
      * Life  
        * Born: July 5th, 1983  
        * Adopted: Moved to Columbia, October 1983  
        * Moved to Chambersburg, 1992  
        * Graduated High School, 2001  
        * Moved to Philly, 2001  
        * Moved to Williamsport, 2002  
        * Moved back to Chambersburg, 2004  
        * Moved back to Columbia, 2005?6  
        * Bought Condo: July 2008  
        * Bought Townhouse: Late 2018  
        * Married: Elena Herron, August 28th, 2019  
      * TTRPGs  
        * Isle of Glass Statues II \- D\&D 5E  
          * July 21-27, 2024  
          * Dan Wells \- Game Night Getaway ‘24  
        * Halfling Baked \- D\&D 5E  
          * Ongoing  
          * March, 2023  
        * Repocalypse (Comedy of Justice II) \- D\&D 5E and PbtA  
          * July, 2021 \- Mid 2023  
        * Crumblewood \- D\&D 5E and Humblewood  
          * July and August, 2021  
        * Papaku Vai \- D\&D 5E  
          * July, 2019 \- Mid 2020  
        * Truugahn II \- D\&D 5E  
          * April, 2018 \- Oct 12, 2019  
        * Isle of Glass Statues \- D\&D 5E  
          * Oct, 2016 \- Mid 2017  
        * Bonewall \- D\&D 5E  
          * Mid 2014 \- Oct, 2016   
        * Comedy of Justice \- D\&D 5E  
          * July, 2015 \- Mid 2016  
        * Truugahn \- D\&D 4E  
          * 2011 \- 2014  
    * Employed  
      * ZOS \- January 2013  
        * ZOSU  
          * Holding everyone together during a project cancellation  
          * Running for BC  
          * Vote to Unionize  
          * Joining the Organizing Committee  
        * The Elder Scrolls Online  
          * Detail each redesign/rebuild  
          * Case Studies with different pages/parts  
            * 3D Backgrounds  
            * Hotloading  
          * Patcher  
            * Rebuild in 2025  
            * First build in 2013-2014  
        * Unannounced Game  
          * Ended July 2025  
        * Keen  
          *   
        * APE  
          * Laravel Years  
          * Frameworkless Rebuild  
      * Engility/L3/MPRI \- 2008  
        * [Army.mil](http://www.army.mil)  
        * [My.Army.mil](http://My.Army.mil)  
      * NASA/Goddard Space Flight Center/Mantech \- 2007  
        * SMA \- Safety and Mission Assurance  
    * Academic  
      * UAT \- Degree, 2004-2006 \- Game Design  
      * Penn College of Technology, 2003-2004 \- Computer Science  
      * UArts \- 2001-2002 \- Multimedia  
  * Skills
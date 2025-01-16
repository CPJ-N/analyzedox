import Image from 'next/image';
import Link from 'next/link';

export default function ContactUs() {
  return (
    <div className="main-about-us-page-wrapper">
      <div className="relative w-full h-screen">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/240_F_485397626_ydPEYshMKRIyY7HIH2jUCLu8nkC7X2KH.jpg" // Make sure the path is correct
            layout="fill"
            objectFit="cover"
            quality={100}
            alt="Law Firm Background"
          />
        </div>
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center">
          <h1 className="text-6xl text-white font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300 mb-8">We are a dedicated team of legal professionals providing expert services for all your legal needs.</p>
        </div>
      </div>
    </div>
  );
}

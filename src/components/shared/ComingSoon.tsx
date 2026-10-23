"use client";

export const ComingSoon = () => {
  return (
    <div className="flex rounded-2xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center w-full min-h-full relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-2xl opacity-60"
          style={{
            top: "-50px",
            right: "-50px",
            animation: "blob 7s infinite",
          }}
        ></div>
        <div
          className="absolute w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-2xl opacity-60"
          style={{
            bottom: "-50px",
            left: "-50px",
            animation: "blob 7s infinite 2s",
          }}
        ></div>
        <div
          className="absolute w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-2xl opacity-60"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "blob 7s infinite 4s",
          }}
        ></div>
      </div>

      {/* Content */}
      <div className="text-center w-full p-4 z-10 max-w-2xl">
        {/* Badge */}
        <div className="mb-8 inline-block">
          <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-medium">
            🚀 Something Exciting is Coming
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Coming{" "}
          <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Soon
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
          We&apos;re working hard to bring you something amazing.
        </p>
      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default function BoxHeader() {
  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <div>
        <img
          src={"/assets/logos/hirely-dark.svg"}
          alt="Hirely logo"
          className="dark:block hidden"
          width={120}
          height={40}
        />
        <img
          src={"/assets/logos/hirely.svg"}
          alt="Hirely logo"
          className="dark:hidden block"
          width={120}
          height={40}
        />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        Welcome Back
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 text-center">
        Sign in to continue to your dashboard
      </p>
    </div>
  );
}
